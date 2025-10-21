use crate::peer_node;

use anyhow::{Context, Result};
use n0_future::{Stream, StreamExt};
use iroh::SecretKey;
use serde::Serialize;
use tracing::level_filters::LevelFilter;
use tracing_subscriber_wasm::MakeConsoleWriter;
use wasm_bindgen::{JsError, prelude::wasm_bindgen};
use wasm_streams::{ReadableStream, readable::sys::ReadableStream as JsReadableStream};
use hex;

#[wasm_bindgen(start)]
fn start() {
    console_error_panic_hook::set_once();

    tracing_subscriber::fmt()
        .with_max_level(LevelFilter::TRACE)
        .with_writer(
            // To avoide trace events in the browser from showing their JS backtrace
            MakeConsoleWriter::default().map_trace_level_to(tracing::Level::DEBUG),
        )
        // If we don't do this in the browser, we get a runtime error.
        .without_time()
        .with_ansi(false)
        .init();

    tracing::info!("(testing logging) Logging setup");
}

#[wasm_bindgen]
pub struct PeerNode(peer_node::PeerNode);

#[wasm_bindgen]
impl PeerNode {
    /// Spawns a new peer node.
    /// 
    /// # Arguments
    /// * `secret_key_str` - Optional hex-encoded secret key string. If None, a new key is generated.
    /// * `role_str` - The role as a string: "employee", "issuer", or "verifier"
    pub async fn spawn(secret_key_str: Option<String>, role_str: String) -> Result<Self, JsError> {
        // Parse the optional secret key
        let secret_key = if let Some(key_str) = secret_key_str {
            Some(
                key_str
                    .parse::<SecretKey>()
                    .context("failed to parse secret key")
                    .map_err(to_js_err)?
            )
        } else {
            None
        };

        // Parse the role from string
        let role = match role_str.to_lowercase().as_str() {
            "employee" => peer_node::Role::Employee,
            "issuer" => peer_node::Role::Issuer,
            "verifier" => peer_node::Role::Verifier,
            _ => return Err(JsError::new(&format!("Invalid role: {}. Must be 'employee', 'issuer', or 'verifier'", role_str))),
        };

        Ok(Self(peer_node::PeerNode::spawn(secret_key, role).await.map_err(to_js_err)?))
    }

    pub fn events(&self) -> JsReadableStream {
        let stream = self.0.accept_events();
        into_js_readable_stream(stream)
    }

    pub fn node_id(&self) -> String {
        self.0.endpoint().node_id().to_string()
    }

    pub fn secret_key(&self) -> String {
        // Convert SecretKey to hex string
        hex::encode(self.0.secret_key().to_bytes())
    }

    pub fn connect(&self, node_id: String, payload: String) -> Result<JsReadableStream, JsError> {
        let node_id = node_id
            .parse()
            .context("failed to parse node id")
            .map_err(to_js_err)?;
        
        // Log payload
        tracing::info!("payload: {}", payload);
        // Parse the payload as a CredentialMessage
        let message: peer_node::CredentialMessage = serde_json::from_str(&payload)
            .context("failed to parse credential message from JSON")
            .map_err(to_js_err)?;
        
        let stream = self.0.connect(node_id, message);
        Ok(into_js_readable_stream(stream))
    }

    // Issuer methods

    /// Get all pending credential requests (returns JSON string)
    pub async fn get_pending_requests(&self) -> Result<String, JsError> {
        let requests = self.0.get_pending_requests().await;
        serde_json::to_string(&requests)
            .context("failed to serialize pending requests")
            .map_err(to_js_err)
    }

    /// Approve a pending credential request
    pub async fn approve_request(&self, request_id: String) -> Result<(), JsError> {
        self.0.approve_request(request_id)
            .await
            .map_err(to_js_err)
    }

    /// Reject a pending credential request
    pub async fn reject_request(&self, request_id: String, reason: Option<String>) -> Result<(), JsError> {
        self.0.reject_request(request_id, reason)
            .await
            .map_err(to_js_err)
    }

    // Verifier methods

    /// Add a trusted issuer
    pub async fn add_trusted_issuer(&self, node_id: String) -> Result<(), JsError> {
        let node_id = node_id
            .parse()
            .context("failed to parse node id")
            .map_err(to_js_err)?;
        self.0.add_trusted_issuer(node_id)
            .await
            .map_err(to_js_err)
    }

    /// Remove a trusted issuer
    pub async fn remove_trusted_issuer(&self, node_id: String) -> Result<(), JsError> {
        let node_id = node_id
            .parse()
            .context("failed to parse node id")
            .map_err(to_js_err)?;
        self.0.remove_trusted_issuer(node_id)
            .await
            .map_err(to_js_err)
    }

    /// Check if an issuer is trusted
    pub async fn is_trusted_issuer(&self, node_id: String) -> Result<bool, JsError> {
        let node_id = node_id
            .parse()
            .context("failed to parse node id")
            .map_err(to_js_err)?;
        Ok(self.0.is_trusted_issuer(node_id).await)
    }

    /// Get all trusted issuers (returns JSON string array)
    pub async fn get_trusted_issuers(&self) -> Result<String, JsError> {
        let issuers = self.0.get_trusted_issuers().await;
        let issuer_strings: Vec<String> = issuers.iter().map(|id| id.to_string()).collect();
        serde_json::to_string(&issuer_strings)
            .context("failed to serialize trusted issuers")
            .map_err(to_js_err)
    }

    // Employee methods

    /// Get all received credentials (returns JSON string)
    pub async fn get_received_credentials(&self) -> Result<String, JsError> {
        let credentials = self.0.get_received_credentials().await;
        serde_json::to_string(&credentials)
            .context("failed to serialize received credentials")
            .map_err(to_js_err)
    }

    /// Get a specific received credential by request ID (returns JSON string or null)
    pub async fn get_received_credential(&self, request_id: String) -> Result<Option<String>, JsError> {
        let credential = self.0.get_received_credential(request_id).await;
        match credential {
            Some(cred) => {
                let json = serde_json::to_string(&cred)
                    .context("failed to serialize credential")
                    .map_err(to_js_err)?;
                Ok(Some(json))
            }
            None => Ok(None),
        }
    }
}

fn to_js_err(err: impl Into<anyhow::Error>) -> JsError {
    let err: anyhow::Error = err.into();
    JsError::new(&err.to_string())
}

fn into_js_readable_stream<T: Serialize>(
    stream: impl Stream<Item = T> + 'static,
) -> wasm_streams::readable::sys::ReadableStream {
    let stream = stream.map(|event| Ok(serde_wasm_bindgen::to_value(&event).unwrap()));
    ReadableStream::from_stream(stream).into_raw()
}

#[wasm_bindgen]
pub fn generate_key() -> String {
    let secret_key = SecretKey::generate(&mut rand::rng());
    hex::encode(secret_key.to_bytes())
}