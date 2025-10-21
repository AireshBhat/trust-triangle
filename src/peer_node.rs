use anyhow::Result;
use async_channel::Sender;
use iroh::{
    Endpoint, NodeId, SecretKey,
    endpoint::Connection,
    protocol::{AcceptError, ProtocolHandler, Router},
};
use n0_future::{Stream, StreamExt, boxed::BoxStream, task};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tokio_stream::wrappers::BroadcastStream;
use tracing::info;

use crate::credentials::income_credential::{SignedIncomeCredential, PaymentMode, IncomeCredential};

/// Status of a pending credential request
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum RequestStatus {
    Pending,
    Approved,
    Rejected,
}

/// A pending credential request awaiting issuer approval
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingCredentialRequest {
    pub request_id: String,
    pub employee_node_id: NodeId,
    pub employee_name: String,
    pub gross_salary: String,
    pub net_salary: String,
    pub currency: String,
    pub pay_period: String,
    pub payment_mode: PaymentMode,
    pub requested_at: String,
    pub status: RequestStatus,
}

/// A received credential response (approved or rejected)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceivedCredentialResponse {
    pub request_id: String,
    pub credential: Option<SignedIncomeCredential>,
    pub error: Option<String>,
    pub received_at: String,
    pub issuer_node_id: NodeId,
}

pub struct PeerNode {
    secret_key: SecretKey,
    router: Router,
    accept_events: broadcast::Sender<AcceptEvent>,
    peer: Peer, // Shared peer instance for state management
}

const CREDENTIAL_ALPN: &[u8] = b"social-id/credential/v1";

impl PeerNode {
    /// Spawns a peer node.
    pub async fn spawn(secret_key: Option<SecretKey>, role: Role) -> Result<Self, anyhow::Error> {
        let secret_key = secret_key.unwrap_or_else(|| SecretKey::generate(&mut rand::rng()));
        let endpoint = iroh::Endpoint::builder()
            .secret_key(secret_key.clone())
            .discovery_n0()
            .alpns(vec![CREDENTIAL_ALPN.to_vec()])
            .bind()
            .await?;
        info!("endpoint bound");

        let node_id = endpoint.node_id();
        info!("node id: {node_id:#?}");

        let (event_sender, _event_receiver) = broadcast::channel(128);
        
        let pending_requests = Arc::new(RwLock::new(HashMap::new()));
        let trusted_issuers = Arc::new(RwLock::new(HashSet::new()));
        let received_credentials = Arc::new(RwLock::new(HashMap::new()));

        let peer = Peer::new(
            event_sender.clone(),
            role.clone(),
            secret_key.clone(),
            node_id,
            pending_requests,
            trusted_issuers,
            received_credentials,
        );

        let router = Router::builder(endpoint)
            .accept(CREDENTIAL_ALPN, peer.clone())
            .spawn();
        info!("router spawned");
        Ok(Self {
            router,
            secret_key,
            accept_events: event_sender,
            peer,
        })
    }

    pub fn endpoint(&self) -> &Endpoint {
        self.router.endpoint()
    }

    pub fn secret_key(&self) -> &SecretKey {
        &self.secret_key
    }

    pub fn accept_events(&self) -> BoxStream<AcceptEvent> {
        let receiver = self.accept_events.subscribe();
        Box::pin(BroadcastStream::new(receiver).filter_map(|event| event.ok()))
    }

    pub fn connect(
        &self,
        node_id: NodeId,
        message: CredentialMessage,
    ) -> impl Stream<Item = ConnectEvent> + Unpin + use<> {
        let (event_sender, event_receiver) = async_channel::bounded(16);
        let endpoint = self.router.endpoint().clone();
        task::spawn(async move {
            let res = connect(&endpoint, node_id, message, event_sender.clone()).await;
            let error = res.as_ref().err().map(|err| err.to_string());
            event_sender.send(ConnectEvent::Closed { error }).await.ok();
        });
        Box::pin(event_receiver)
    }

    pub async fn generate_key() -> Result<SecretKey, anyhow::Error> {
        let secret_key = SecretKey::generate(&mut rand::rng());
        Ok(secret_key)
    }

    /// Get all pending credential requests (Issuer only)
    pub async fn get_pending_requests(&self) -> Vec<PendingCredentialRequest> {
        self.peer.get_pending_requests().await
    }

    /// Approve a pending credential request and send signed credential to employee
    pub async fn approve_request(&self, request_id: String) -> Result<(), anyhow::Error> {
        self.peer.approve_request(request_id, &self.secret_key, self.endpoint()).await
    }

    /// Reject a pending credential request
    pub async fn reject_request(&self, request_id: String, reason: Option<String>) -> Result<(), anyhow::Error> {
        self.peer.reject_request(request_id, reason, self.endpoint()).await
    }

    /// Add a trusted issuer to the trust list (Verifier only)
    pub async fn add_trusted_issuer(&self, node_id: NodeId) -> Result<(), anyhow::Error> {
        self.peer.add_trusted_issuer(node_id).await
    }

    /// Remove a trusted issuer from the trust list (Verifier only)
    pub async fn remove_trusted_issuer(&self, node_id: NodeId) -> Result<(), anyhow::Error> {
        self.peer.remove_trusted_issuer(node_id).await
    }

    /// Check if an issuer is trusted (Verifier only)
    pub async fn is_trusted_issuer(&self, node_id: NodeId) -> bool {
        self.peer.is_trusted_issuer(node_id).await
    }

    /// Get all trusted issuers (Verifier only)
    pub async fn get_trusted_issuers(&self) -> Vec<NodeId> {
        self.peer.get_trusted_issuers().await
    }

    /// Get all received credentials (Employee only)
    pub async fn get_received_credentials(&self) -> Vec<ReceivedCredentialResponse> {
        self.peer.get_received_credentials().await
    }

    /// Get a specific received credential by request ID (Employee only)
    pub async fn get_received_credential(&self, request_id: String) -> Option<ReceivedCredentialResponse> {
        self.peer.get_received_credential(request_id).await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ConnectEvent {
    Connected,
    MessageSent {
        message: CredentialMessage,
        bytes_sent: u64,
    },
    ResponseReceived {
        message: CredentialMessage,
        bytes_received: u64,
    },
    Closed {
        error: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AcceptEvent {
    Accepted {
        node_id: NodeId,
    },
    MessageReceived {
        node_id: NodeId,
        message: CredentialMessage,
    },
    ResponseSent {
        node_id: NodeId,
        message: CredentialMessage,
        bytes_sent: u64,
    },
    Closed {
        node_id: NodeId,
        error: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum Role {
    Employee,
    Issuer,
    Verifier,
}

/// Structured messages for credential protocol
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum CredentialMessage {
    /// Employee → Issuer: Request to issue an income credential
    IssueRequest {
        request_id: String,
        employee_node_id: NodeId,
        employee_name: String,
        gross_salary: String,
        net_salary: String,
        currency: String,
        pay_period: String,
        payment_mode: PaymentMode,
    },
    
    /// Issuer → Employee: Acknowledgment that request is queued for approval
    RequestQueued {
        request_id: String,
        message: String,
    },
    
    /// Issuer → Employee: Response with signed credential or error
    IssueResponse {
        request_id: String,
        credential: Option<SignedIncomeCredential>,
        error: Option<String>,
    },
    
    /// Employee → Verifier: Present a credential for verification
    PresentCredential {
        presentation_id: String,
        credential: SignedIncomeCredential,
    },
    
    /// Verifier → Employee: Result of credential verification
    VerificationResult {
        presentation_id: String,
        is_valid: bool,
        is_trusted: bool,
        issuer_node_id: NodeId,
        message: String,
    },
    
    /// Generic error message
    Error {
        request_id: String,
        error_code: String,
        message: String,
    },
}

#[derive(Clone)]
pub struct Peer {
    event_sender: broadcast::Sender<AcceptEvent>,
    role: Role,
    secret_key: SecretKey,
    node_id: NodeId,
    pending_requests: Arc<RwLock<HashMap<String, PendingCredentialRequest>>>,
    trusted_issuers: Arc<RwLock<HashSet<NodeId>>>,
    received_credentials: Arc<RwLock<HashMap<String, ReceivedCredentialResponse>>>,
}

impl std::fmt::Debug for Peer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Peer")
            .field("role", &self.role)
            .field("node_id", &self.node_id)
            .finish()
    }
}

impl Peer {
    pub fn new(
        event_sender: broadcast::Sender<AcceptEvent>,
        role: Role,
        secret_key: SecretKey,
        node_id: NodeId,
        pending_requests: Arc<RwLock<HashMap<String, PendingCredentialRequest>>>,
        trusted_issuers: Arc<RwLock<HashSet<NodeId>>>,
        received_credentials: Arc<RwLock<HashMap<String, ReceivedCredentialResponse>>>,
    ) -> Self {
        Self {
            event_sender,
            role,
            secret_key,
            node_id,
            pending_requests,
            trusted_issuers,
            received_credentials,
        }
    }
}

impl Peer {
    async fn handle_connection(
        self,
        connection: Connection,
    ) -> std::result::Result<(), AcceptError> {
        let node_id = connection.remote_node_id()?;
        self.event_sender
            .send(AcceptEvent::Accepted { node_id })
            .ok();
        let res = self.handle_connection_0(&connection).await;
        let error = res.as_ref().err().map(|err| err.to_string());
        self.event_sender
            .send(AcceptEvent::Closed { node_id, error })
            .ok();
        res
    }

    async fn handle_connection_0(&self, connection: &Connection) -> Result<(), AcceptError> {
        let node_id = connection.remote_node_id().unwrap();
        info!("Accepted connection from {node_id}");

        // Our protocol is a request-response protocol with structured messages
        let (mut send, mut recv) = connection.accept_bi().await?;

        // Read the incoming message (max 1MB)
        let buffer = recv.read_to_end(1024 * 1024).await.map_err(|e| {
            std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to read message: {}", e))
        })?;

        // Parse the message as JSON
        let message: CredentialMessage = serde_json::from_slice(&buffer).map_err(|e| {
            tracing::error!("Failed to parse message: {}", e);
            std::io::Error::new(std::io::ErrorKind::InvalidData, format!("Failed to parse message: {}", e))
        })?;

        info!("Received message type: {:?}", std::mem::discriminant(&message));

        // Emit the received message event
        self.event_sender
            .send(AcceptEvent::MessageReceived {
                node_id,
                message: message.clone(),
            })
            .ok();

        // Route the message based on role and message type
        let response = match (&self.role, &message) {
            (Role::Issuer, CredentialMessage::IssueRequest { .. }) => {
                self.handle_issue_request(message).await
            }
            (Role::Verifier, CredentialMessage::PresentCredential { .. }) => {
                self.handle_verify_credential(message).await
            }
            (Role::Employee, CredentialMessage::IssueResponse { .. }) => {
                self.handle_issue_response(message, node_id).await
            }
            _ => {
                let error_msg = format!(
                    "Role {:?} cannot handle this message type",
                    self.role
                );
                tracing::warn!("{}", error_msg);
                Ok(CredentialMessage::Error {
                    request_id: "unknown".to_string(),
                    error_code: "INVALID_MESSAGE_FOR_ROLE".to_string(),
                    message: error_msg,
                })
            }
        }
        .unwrap_or_else(|e| {
            tracing::error!("Error handling message: {}", e);
            CredentialMessage::Error {
                request_id: "unknown".to_string(),
                error_code: "PROCESSING_ERROR".to_string(),
                message: format!("Error processing request: {}", e),
            }
        });

        // Serialize and send the response
        let response_bytes = serde_json::to_vec(&response).map_err(|e| {
            std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to serialize response: {}", e))
        })?;

        send.write_all(&response_bytes).await.map_err(|e| {
            std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to write response: {}", e))
        })?;
        send.finish().map_err(|e| {
            std::io::Error::new(std::io::ErrorKind::Other, format!("Failed to finish stream: {}", e))
        })?;

        info!("Sent response, {} bytes", response_bytes.len());

        // Emit the response sent event
        self.event_sender
            .send(AcceptEvent::ResponseSent {
                node_id,
                message: response,
                bytes_sent: response_bytes.len() as u64,
            })
            .ok();

        // Wait until the remote closes the connection
        connection.closed().await;
        Ok(())
    }

    /// Handle income credential issuance request (Issuer role)
    /// Queues the request for manual approval instead of auto-signing
    async fn handle_issue_request(
        &self,
        message: CredentialMessage,
    ) -> Result<CredentialMessage, anyhow::Error> {
        if let CredentialMessage::IssueRequest {
            request_id,
            employee_node_id,
            employee_name,
            gross_salary,
            net_salary,
            currency,
            pay_period,
            payment_mode,
        } = message
        {
            info!("Queuing credential request from {} ({})", employee_name, employee_node_id);
            
            // Create pending request
            let pending_request = PendingCredentialRequest {
                request_id: request_id.clone(),
                employee_node_id,
                employee_name: employee_name.clone(),
                gross_salary,
                net_salary,
                currency,
                pay_period,
                payment_mode,
                requested_at: chrono::Utc::now().to_rfc3339(),
                status: RequestStatus::Pending,
            };
            
            // Store in pending requests
            let mut requests = self.pending_requests.write().await;
            requests.insert(request_id.clone(), pending_request);
            drop(requests); // Release lock
            
            info!("Request {} queued for approval", request_id);
            
            // Return acknowledgment that request is queued
            Ok(CredentialMessage::RequestQueued {
                request_id,
                message: format!(
                    "Your credential request has been queued for approval by {}",
                    employee_name
                ),
            })
        } else {
            Err(anyhow::anyhow!("Invalid message type for handle_issue_request"))
        }
    }

    /// Handle credential issuance response (Employee role)
    /// Stores the received credential (approved or rejected)
    async fn handle_issue_response(
        &self,
        message: CredentialMessage,
        issuer_node_id: NodeId,
    ) -> Result<CredentialMessage, anyhow::Error> {
        if let CredentialMessage::IssueResponse {
            request_id,
            credential,
            error,
        } = message
        {
            info!("Received credential response for request {}", request_id);
            
            // Store the received credential response
            let response = ReceivedCredentialResponse {
                request_id: request_id.clone(),
                credential: credential.clone(),
                error: error.clone(),
                received_at: chrono::Utc::now().to_rfc3339(),
                issuer_node_id,
            };
            
            let mut credentials = self.received_credentials.write().await;
            credentials.insert(request_id.clone(), response);
            drop(credentials);
            
            if credential.is_some() {
                info!("Credential approved and stored for request {}", request_id);
            } else {
                info!("Credential request {} was rejected: {:?}", request_id, error);
            }
            
            // Return a simple acknowledgment
            Ok(CredentialMessage::RequestQueued {
                request_id,
                message: "Credential response received and stored".to_string(),
            })
        } else {
            Err(anyhow::anyhow!("Invalid message type for handle_issue_response"))
        }
    }

    /// Handle credential verification (Verifier role)
    /// Checks both signature validity and issuer trust
    async fn handle_verify_credential(
        &self,
        message: CredentialMessage,
    ) -> Result<CredentialMessage, anyhow::Error> {
        if let CredentialMessage::PresentCredential {
            presentation_id,
            credential,
        } = message
        {
            let issuer_node_id = credential.issuer_node_id();
            info!("Verifying credential from {} issued by {}", 
                credential.employee_node_id(), issuer_node_id);
            
            // Check if issuer is trusted
            let trusted_issuers = self.trusted_issuers.read().await;
            let is_trusted = trusted_issuers.contains(&issuer_node_id);
            drop(trusted_issuers); // Release lock
            
            // Verify the signature
            match credential.verify() {
                Ok(is_valid) => {
                    let message_text = if is_valid && is_trusted {
                        format!(
                            "Credential verified successfully. Issued by trusted issuer: {}",
                            issuer_node_id
                        )
                    } else if is_valid && !is_trusted {
                        format!(
                            "Credential signature is valid but issuer {} is not in trusted list",
                            issuer_node_id
                        )
                    } else {
                        "Invalid credential signature".to_string()
                    };
                    
                    info!("Verification result: valid={}, trusted={}", is_valid, is_trusted);
                    
                    Ok(CredentialMessage::VerificationResult {
                        presentation_id,
                        is_valid,
                        is_trusted,
                        issuer_node_id,
                        message: message_text,
                    })
                }
                Err(e) => {
                    tracing::error!("Verification error: {}", e);
                    Ok(CredentialMessage::VerificationResult {
                        presentation_id,
                        is_valid: false,
                        is_trusted: false,
                        issuer_node_id,
                        message: format!("Verification error: {}", e),
                    })
                }
            }
        } else {
            Err(anyhow::anyhow!("Invalid message type for handle_verify_credential"))
        }
    }

    // State management methods

    /// Get all pending credential requests
    pub async fn get_pending_requests(&self) -> Vec<PendingCredentialRequest> {
        let requests = self.pending_requests.read().await;
        requests.values().cloned().collect()
    }

    /// Approve a pending credential request and send signed credential to employee
    pub async fn approve_request(
        &self,
        request_id: String,
        secret_key: &SecretKey,
        endpoint: &Endpoint,
    ) -> Result<(), anyhow::Error> {
        // Get and update the request
        let mut requests = self.pending_requests.write().await;
        let request = requests.get_mut(&request_id)
            .ok_or_else(|| anyhow::anyhow!("Request {} not found", request_id))?;
        
        if request.status != RequestStatus::Pending {
            return Err(anyhow::anyhow!("Request {} is not pending (status: {:?})", 
                request_id, request.status));
        }
        
        // Clone the data we need before releasing the lock
        let employee_node_id = request.employee_node_id;
        let employee_name = request.employee_name.clone();
        let credential_data = request.clone();
        
        // Update status
        request.status = RequestStatus::Approved;
        drop(requests); // Release lock
        
        info!("Approving request {} for {}", request_id, employee_name);
        
        // Create and sign the credential
        let credential = IncomeCredential::new(
            credential_data.employee_node_id,
            credential_data.employee_name,
            self.node_id,
            "AscentHR Organization".to_string(), // TODO: Make configurable
            credential_data.gross_salary,
            credential_data.net_salary,
            credential_data.currency,
            credential_data.pay_period,
            credential_data.payment_mode,
        );
        
        let signed_credential = credential.sign(secret_key)
            .map_err(|e| anyhow::anyhow!("Failed to sign credential: {}", e))?;
        
        info!("Credential signed, connecting to employee {}", employee_node_id);
        
        // Send the signed credential to the employee
        let message = CredentialMessage::IssueResponse {
            request_id: request_id.clone(),
            credential: Some(signed_credential),
            error: None,
        };
        
        // Initiate connection to employee
        let endpoint = endpoint.clone();
        task::spawn(async move {
            let (event_sender, _) = async_channel::bounded(16);
            if let Err(e) = connect(&endpoint, employee_node_id, message, event_sender).await {
                tracing::error!("Failed to send credential to employee: {}", e);
            }
        });
        
        info!("Credential sent to employee {}", employee_node_id);
        Ok(())
    }

    /// Reject a pending credential request
    pub async fn reject_request(
        &self,
        request_id: String,
        reason: Option<String>,
        endpoint: &Endpoint,
    ) -> Result<(), anyhow::Error> {
        // Get and update the request
        let mut requests = self.pending_requests.write().await;
        let request = requests.get_mut(&request_id)
            .ok_or_else(|| anyhow::anyhow!("Request {} not found", request_id))?;
        
        if request.status != RequestStatus::Pending {
            return Err(anyhow::anyhow!("Request {} is not pending (status: {:?})", 
                request_id, request.status));
        }
        
        // Clone employee info before releasing lock
        let employee_node_id = request.employee_node_id;
        let employee_name = request.employee_name.clone();
        
        // Update status
        request.status = RequestStatus::Rejected;
        drop(requests); // Release lock
        
        info!("Rejecting request {} for {}", request_id, employee_name);
        
        // Send rejection message to employee
        let message = CredentialMessage::IssueResponse {
            request_id: request_id.clone(),
            credential: None,
            error: Some(reason.unwrap_or_else(|| "Request rejected by issuer".to_string())),
        };
        
        // Initiate connection to employee
        let endpoint = endpoint.clone();
        task::spawn(async move {
            let (event_sender, _) = async_channel::bounded(16);
            if let Err(e) = connect(&endpoint, employee_node_id, message, event_sender).await {
                tracing::error!("Failed to send rejection to employee: {}", e);
            }
        });
        
        info!("Rejection sent to employee {}", employee_node_id);
        Ok(())
    }

    /// Add a trusted issuer to the trust list
    pub async fn add_trusted_issuer(&self, node_id: NodeId) -> Result<(), anyhow::Error> {
        let mut issuers = self.trusted_issuers.write().await;
        let was_new = issuers.insert(node_id);
        drop(issuers);
        
        if was_new {
            info!("Added trusted issuer: {}", node_id);
        } else {
            info!("Issuer {} was already trusted", node_id);
        }
        Ok(())
    }

    /// Remove a trusted issuer from the trust list
    pub async fn remove_trusted_issuer(&self, node_id: NodeId) -> Result<(), anyhow::Error> {
        let mut issuers = self.trusted_issuers.write().await;
        let was_present = issuers.remove(&node_id);
        drop(issuers);
        
        if was_present {
            info!("Removed trusted issuer: {}", node_id);
        } else {
            info!("Issuer {} was not in trusted list", node_id);
        }
        Ok(())
    }

    /// Check if an issuer is trusted
    pub async fn is_trusted_issuer(&self, node_id: NodeId) -> bool {
        let issuers = self.trusted_issuers.read().await;
        issuers.contains(&node_id)
    }

    /// Get all trusted issuers
    pub async fn get_trusted_issuers(&self) -> Vec<NodeId> {
        let issuers = self.trusted_issuers.read().await;
        issuers.iter().copied().collect()
    }

    /// Get all received credentials (Employee)
    pub async fn get_received_credentials(&self) -> Vec<ReceivedCredentialResponse> {
        let credentials = self.received_credentials.read().await;
        credentials.values().cloned().collect()
    }

    /// Get a specific received credential by request ID (Employee)
    pub async fn get_received_credential(&self, request_id: String) -> Option<ReceivedCredentialResponse> {
        let credentials = self.received_credentials.read().await;
        credentials.get(&request_id).cloned()
    }
}

impl ProtocolHandler for Peer {
    /// The `accept` method is called for each incoming connection for our ALPN.
    ///
    /// The returned future runs on a newly spawned tokio task, so it can run as long as
    /// the connection lasts.
    async fn accept(&self, connection: Connection) -> std::result::Result<(), AcceptError> {
        self.clone().handle_connection(connection).await
    }
}

async fn connect(
    endpoint: &Endpoint,
    node_id: NodeId,
    message: CredentialMessage,
    event_sender: Sender<ConnectEvent>,
) -> Result<()> {
    let connection = endpoint.connect(node_id, CREDENTIAL_ALPN).await?;
    event_sender.send(ConnectEvent::Connected).await?;
    
    let (mut send_stream, mut recv_stream) = connection.open_bi().await?;
    
    // Serialize the message to JSON
    let message_bytes = serde_json::to_vec(&message)?;
    
    // Send the message
    send_stream.write_all(&message_bytes).await?;
    send_stream.finish()?;
    
    info!("Sent message, {} bytes", message_bytes.len());
    
    event_sender
        .send(ConnectEvent::MessageSent {
            message: message.clone(),
            bytes_sent: message_bytes.len() as u64,
        })
        .await?;
    
    // Read the response (max 1MB)
    let response_buffer = recv_stream.read_to_end(1024 * 1024).await?;
    
    info!("Received response, {} bytes", response_buffer.len());
    
    // Parse the response
    let response: CredentialMessage = serde_json::from_slice(&response_buffer)?;
    
    event_sender
        .send(ConnectEvent::ResponseReceived {
            message: response,
            bytes_received: response_buffer.len() as u64,
        })
        .await?;
    
    // Close the connection
    connection.close(1u8.into(), b"done");
    Ok(())
}