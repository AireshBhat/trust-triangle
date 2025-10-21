use iroh::{NodeId, SecretKey};
use iroh_base::Signature;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CredentialError {
    #[error("failed to sign credential: {0}")]
    SigningError(String),
    
    #[error("failed to verify credential: {0}")]
    VerificationError(String),
    
    #[error("invalid signature")]
    InvalidSignature,
    
    #[error("serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PaymentMode {
    BankTransfer,
    Crypto,
    Check,
    Cash,
    Other,
}

impl PaymentMode {
    pub fn as_str(&self) -> &str {
        match self {
            PaymentMode::BankTransfer => "Bank Transfer",
            PaymentMode::Crypto => "Cryptocurrency",
            PaymentMode::Check => "Check",
            PaymentMode::Cash => "Cash",
            PaymentMode::Other => "Other",
        }
    }
}

/// Core income credential data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeCredential {
    /// Unique credential identifier
    pub id: String,
    /// Employee's node ID (DID)
    pub employee_node_id: NodeId,
    /// Employee's name
    pub employee_name: String,
    /// Employer's node ID (DID) - the issuer
    pub employer_node_id: NodeId,
    /// Employer's organization name
    pub employer_name: String,
    /// Optional payroll processor node ID
    pub payroll_processor_node_id: Option<NodeId>,
    /// Optional payroll processor name
    pub payroll_processor_name: Option<String>,
    /// Gross salary amount (as string to avoid float precision issues)
    pub gross_salary: String,
    /// Net salary amount after deductions
    pub net_salary: String,
    /// Currency code (e.g., USD, EUR, GBP)
    pub currency: String,
    /// Pay period (e.g., "2024-01" for January 2024)
    pub pay_period: String,
    /// Payment mode
    pub payment_mode: PaymentMode,
    /// Timestamp when credential was issued (RFC3339 format)
    pub issued_at: String,
}

/// Signed income credential with cryptographic signature
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignedIncomeCredential {
    /// The credential data
    pub credential: IncomeCredential,
    /// Cryptographic signature from the issuer (employer)
    pub signature: Vec<u8>,
}

impl IncomeCredential {
    /// Creates a new income credential
    pub fn new(
        employee_node_id: NodeId,
        employee_name: String,
        employer_node_id: NodeId,
        employer_name: String,
        gross_salary: String,
        net_salary: String,
        currency: String,
        pay_period: String,
        payment_mode: PaymentMode,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            employee_node_id,
            employee_name,
            employer_node_id,
            employer_name,
            payroll_processor_node_id: None,
            payroll_processor_name: None,
            gross_salary,
            net_salary,
            currency,
            pay_period,
            payment_mode,
            issued_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Creates a credential with payroll processor information
    pub fn new_with_processor(
        employee_node_id: NodeId,
        employee_name: String,
        employer_node_id: NodeId,
        employer_name: String,
        payroll_processor_node_id: NodeId,
        payroll_processor_name: String,
        gross_salary: String,
        net_salary: String,
        currency: String,
        pay_period: String,
        payment_mode: PaymentMode,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            employee_node_id,
            employee_name,
            employer_node_id,
            employer_name,
            payroll_processor_node_id: Some(payroll_processor_node_id),
            payroll_processor_name: Some(payroll_processor_name),
            gross_salary,
            net_salary,
            currency,
            pay_period,
            payment_mode,
            issued_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Generates a human-readable statement from the credential
    pub fn generate_statement(&self) -> String {
        let payroll_info = if let (Some(pp_did), Some(pp_name)) = 
            (&self.payroll_processor_node_id, &self.payroll_processor_name) {
            format!(", processed by {} ({})", pp_name, pp_did)
        } else {
            String::new()
        };
        
        format!(
            "{} ({}) certifies that {} ({}) received a gross salary of {} {} and net salary of {} {} for the pay period {} via {}{}",
            self.employer_name,
            self.employer_node_id,
            self.employee_name,
            self.employee_node_id,
            self.gross_salary,
            self.currency,
            self.net_salary,
            self.currency,
            self.pay_period,
            self.payment_mode.as_str(),
            payroll_info
        )
    }

    /// Signs the credential with the issuer's secret key
    pub fn sign(self, secret_key: &SecretKey) -> Result<SignedIncomeCredential, CredentialError> {
        // Generate the statement to be signed
        let statement = self.generate_statement();
        
        // Sign the statement bytes
        let signature = secret_key.sign(statement.as_bytes());
        
        Ok(SignedIncomeCredential {
            credential: self,
            signature: signature.to_bytes().to_vec(),
        })
    }
}

impl SignedIncomeCredential {
    /// Verifies the credential's signature against the issuer's public key
    pub fn verify(&self) -> Result<bool, CredentialError> {
        // The employer_node_id IS the public key (NodeId = PublicKey)
        let public_key = self.credential.employer_node_id;
        
        // Generate the statement that was signed
        let statement = self.credential.generate_statement();
        
        // Parse the signature bytes (Signature is 64 bytes)
        if self.signature.len() != 64 {
            return Err(CredentialError::VerificationError(
                format!("Invalid signature length: expected 64, got {}", self.signature.len())
            ));
        }
        
        let mut sig_bytes = [0u8; 64];
        sig_bytes.copy_from_slice(&self.signature);
        let signature = Signature::from_bytes(&sig_bytes);
        
        // Verify the signature
        match public_key.verify(statement.as_bytes(), &signature) {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::warn!("Signature verification failed: {}", e);
                Ok(false)
            }
        }
    }

    /// Returns the credential ID
    pub fn id(&self) -> &str {
        &self.credential.id
    }

    /// Returns the employee's node ID
    pub fn employee_node_id(&self) -> NodeId {
        self.credential.employee_node_id
    }

    /// Returns the employer's node ID (issuer)
    pub fn issuer_node_id(&self) -> NodeId {
        self.credential.employer_node_id
    }

    /// Returns a reference to the inner credential
    pub fn credential(&self) -> &IncomeCredential {
        &self.credential
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_secret_key() -> SecretKey {
        SecretKey::generate(&mut rand::rng())
    }

    fn test_node_id(key: &SecretKey) -> NodeId {
        key.public()
    }

    #[test]
    fn test_payment_mode_serialization() {
        let mode = PaymentMode::BankTransfer;
        assert_eq!(mode.as_str(), "Bank Transfer");
        
        let json = serde_json::to_string(&mode).unwrap();
        assert_eq!(json, "\"bank_transfer\"");
        
        let parsed: PaymentMode = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, PaymentMode::BankTransfer);
    }

    #[test]
    fn test_income_credential_creation() {
        let employee_key = test_secret_key();
        let employer_key = test_secret_key();
        
        let employee_node_id = test_node_id(&employee_key);
        let employer_node_id = test_node_id(&employer_key);

        let credential = IncomeCredential::new(
            employee_node_id,
            "John Doe".to_string(),
            employer_node_id,
            "Acme Corporation".to_string(),
            "10000.00".to_string(),
            "8000.00".to_string(),
            "USD".to_string(),
            "2024-01".to_string(),
            PaymentMode::BankTransfer,
        );

        assert_eq!(credential.employee_name, "John Doe");
        assert_eq!(credential.employer_name, "Acme Corporation");
        assert_eq!(credential.gross_salary, "10000.00");
        assert_eq!(credential.net_salary, "8000.00");
        assert_eq!(credential.currency, "USD");
    }

    #[test]
    fn test_income_statement_generation() {
        let employee_key = test_secret_key();
        let employer_key = test_secret_key();
        
        let employee_node_id = test_node_id(&employee_key);
        let employer_node_id = test_node_id(&employer_key);

        let credential = IncomeCredential::new(
            employee_node_id,
            "John Doe".to_string(),
            employer_node_id,
            "Acme Corporation".to_string(),
            "10000.00".to_string(),
            "8000.00".to_string(),
            "USD".to_string(),
            "2024-01".to_string(),
            PaymentMode::BankTransfer,
        );

        let statement = credential.generate_statement();
        assert!(statement.contains("Acme Corporation"));
        assert!(statement.contains("John Doe"));
        assert!(statement.contains("10000.00"));
        assert!(statement.contains("8000.00"));
        assert!(statement.contains("USD"));
        assert!(statement.contains("2024-01"));
        assert!(statement.contains("Bank Transfer"));
    }

    #[test]
    fn test_credential_signing_and_verification() {
        let employee_key = test_secret_key();
        let employer_key = test_secret_key();
        
        let employee_node_id = test_node_id(&employee_key);
        let employer_node_id = test_node_id(&employer_key);

        let credential = IncomeCredential::new(
            employee_node_id,
            "Jane Smith".to_string(),
            employer_node_id,
            "Tech Corp".to_string(),
            "5000.00".to_string(),
            "4200.00".to_string(),
            "EUR".to_string(),
            "2024-02".to_string(),
            PaymentMode::Crypto,
        );

        // Sign with employer's key
        let signed = credential.sign(&employer_key).unwrap();

        // Verify signature
        let is_valid = signed.verify().unwrap();
        assert!(is_valid, "Signature should be valid");
    }

    #[test]
    fn test_credential_with_payroll_processor() {
        let employee_key = test_secret_key();
        let employer_key = test_secret_key();
        let processor_key = test_secret_key();
        
        let employee_node_id = test_node_id(&employee_key);
        let employer_node_id = test_node_id(&employer_key);
        let processor_node_id = test_node_id(&processor_key);

        let credential = IncomeCredential::new_with_processor(
            employee_node_id,
            "Jane Smith".to_string(),
            employer_node_id,
            "Tech Corp".to_string(),
            processor_node_id,
            "Payroll Services Inc".to_string(),
            "5000.00".to_string(),
            "4200.00".to_string(),
            "EUR".to_string(),
            "2024-02".to_string(),
            PaymentMode::Crypto,
        );

        let statement = credential.generate_statement();
        assert!(statement.contains("Tech Corp"));
        assert!(statement.contains("Jane Smith"));
        assert!(statement.contains("Payroll Services Inc"));
        assert!(statement.contains("Cryptocurrency"));
    }

    #[test]
    fn test_invalid_signature_detection() {
        let employee_key = test_secret_key();
        let employer_key = test_secret_key();
        let wrong_key = test_secret_key(); // Different key
        
        let employee_node_id = test_node_id(&employee_key);
        let employer_node_id = test_node_id(&employer_key);

        let credential = IncomeCredential::new(
            employee_node_id,
            "John Doe".to_string(),
            employer_node_id,
            "Acme Corporation".to_string(),
            "10000.00".to_string(),
            "8000.00".to_string(),
            "USD".to_string(),
            "2024-01".to_string(),
            PaymentMode::BankTransfer,
        );

        // Sign with wrong key
        let mut signed = credential.sign(&wrong_key).unwrap();
        
        // Change employer_node_id to the real employer
        signed.credential.employer_node_id = employer_node_id;

        // Verification should fail
        let is_valid = signed.verify().unwrap();
        assert!(!is_valid, "Signature should be invalid when signed with wrong key");
    }
}
