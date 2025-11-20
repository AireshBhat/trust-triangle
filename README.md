# Trust Triangle

A decentralized peer-to-peer verifiable credential system, built on top of [Iroh](https://iroh.computer/) networking. The initial example in Trust Triangle implements a three-party trust model where Employees, Issuers (Employers/Payroll Providers), and Verifiers can interact directly, e2e encrypted.

## Video Demo
[![Trust Triangle Demo](https://img.youtube.com/vi/c8gMgxnRE6Q/0.jpg)](https://www.youtube.com/watch?v=c8gMgxnRE6Q)

## 🌟 Overview

Trust Triangle is a **WebAssembly-powered P2P application** that enables:

- **Peers**: Request and store cryptographically signed statements/credentials
- **Issuers**: Sign and issue verifiable statements/credentials to peers
- **Verifiers**: Validate statements/credentials and check issuer trust

The system uses **direct peer-to-peer connections** via Iroh's QUIC-based networking stack, with **mDNS local network discovery** and **Pkarr DNS-based discovery** for finding peers.

## 🏗️ Architecture

### Trust Model

```
    Employee (Holder)
         ↙    ↘
      Issuer  Verifier
    (Employer) (Service)
         ↘    ↙
       Trust Relationship
```

**Credential Flow:**
1. **Employee → Issuer**: Requests signed income credential
2. **Issuer → Employee**: Issues cryptographically signed credential
3. **Employee → Verifier**: Presents credential for verification
4. **Verifier**: Validates signature and checks issuer trust

### Technical Stack

**Backend (Rust)**
- `iroh` v0.95 - P2P networking, NAT traversal, QUIC transport
- `iroh-gossip` - Event broadcasting
- `wasm-bindgen` - WebAssembly interop
- `blake3` - Cryptographic hashing
- `serde` + `serde_json` - Serialization
- `tokio` - Async runtime
- `uuid` - Unique identifiers
- `chrono` - Timestamp handling

**Frontend (TypeScript + React)**
- React 18 with TypeScript
- Vite - Build tool
- TailwindCSS - Styling
- localForage - Persistent storage
- Lucide React - Icons

**Deployment Target**
- WebAssembly (wasm32-unknown-unknown)
- Browser-based with Web Workers for networking

## 🚀 Getting Started

### Prerequisites

- **Rust** 1.75+ (edition 2024)
- **Node.js** 18+ and npm
- **wasm-bindgen-cli** and **wasm-opt** (for optimized builds)

```bash
# Install wasm-bindgen-cli
cargo install wasm-bindgen-cli

# Install wasm-opt (part of binaryen)
# macOS
brew install binaryen

# Ubuntu/Debian
sudo apt-get install binaryen

# Windows
# Download from https://github.com/WebAssembly/binaryen/releases
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trust-triangle
   ```

2. **Install dependencies**
   ```bash
   # Install root-level dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

### Development

**Option 1: Using Cargo Make (Recommended)**

```bash
# Build WASM and run frontend dev server
cargo make deploy
```

**Option 2: Manual Build**

```bash
# Build WASM module (debug)
npm run build

# Or build optimized release
npm run build:release

# Run frontend dev server
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
# Build optimized WASM + frontend
cargo make deploy

# Frontend build will be in frontend/dist/
cd frontend/dist
# Serve with any static file server
```

## 📖 Usage

### 1. Role Selection

When you first open the app, choose your role:
- **Peer Wallet** - Request and manage statements/credentials
- **Issuer** - Issue signed statements/credentials to peers
- **Verifier (Service)** - Verify statements/credentials from peers

### 2. Peer Flow

**First-Time Setup:**
1. Enter **Issuer Node ID** (the peer ID of the issuer you want to use)
2. Enter **Verifier Node ID** (verification service you want to use)
3. Save configuration

**Requesting Income Credential:**
1. Click "Generate Income Statement"
2. Fill in income details:
   - Gross Salary
   - Net Salary
   - Currency (USD, EUR, GBP, INR, etc.)
   - Pay Period (MM/YYYY)
   - Payment Mode (Bank Transfer, Crypto, Cash, Check, Other)
   - Employee Name (optional)
   - Employee ID (optional)
3. Click "Request Statement Signature"
4. Wait for issuer approval
5. Receive and store signed credential

**Presenting Credentials:**
1. Select a credential from your wallet
2. Choose "Present to Verifier"
3. Verifier validates the signature and issuer trust

### 3. Issuer Flow

**Handling Requests:**
1. View incoming credential requests from employees
2. Review employee information and salary details
3. **Approve** or **Reject** the request
   - Approval: Signs the credential and sends to employee
   - Rejection: Sends rejection message to employee

**Managing Requests:**
- View all pending, approved, and rejected requests
- Each request shows:
  - Request ID
  - Employee Name & Node ID
  - Salary Information
  - Request Timestamp
  - Current Status

### 4. Verifier Flow

**Trust Management:**
1. Add trusted issuer node IDs to your trust list
2. View all trusted issuers

**Credential Verification:**
1. Receive credential presentation from employee
2. Automatically verify cryptographic signature
3. Check if issuer is in trusted list
4. Return verification result:
   - **Valid & Trusted**: Credential is authentic and from trusted issuer
   - **Valid but Untrusted**: Signature is valid but issuer not in trust list
   - **Invalid**: Signature verification failed

**Verification History:**
- View all verified credentials
- Track verification timestamps
- Access credential details

## 🔐 Security Features

### Cryptographic Signatures

All income credentials are signed using **Ed25519 signatures**:

```rust
// Issuer signs the credential
let credential = IncomeCredential::new(/* ... */);
let signed = credential.sign(&issuer_secret_key)?;

// Verifier checks the signature
let is_valid = signed.verify()?; // Returns true/false
```

The credential signature covers:
- Employee information
- Salary details
- Pay period
- Payment mode
- Employer/issuer identity
- Issuance timestamp

### Peer Authentication

- Each peer has a unique **EndpointId** (derived from Ed25519 public key)
- All connections use **authenticated QUIC**
- Node IDs are cryptographically verified by Iroh
- No message spoofing possible

### Privacy

- **No central server** - all communication is peer-to-peer
- Credentials only shared when explicitly presented
- No data retention on network
- Local storage only (browser IndexedDB)

### Trust Model

- Verifiers maintain a **whitelist of trusted issuers**
- Credentials from untrusted issuers are flagged
- Trust decisions are explicit and local
- No global trust registry

## 📡 P2P Networking

### Discovery Mechanisms

**1. mDNS (Local Network)**
```rust
let mdns_discovery = MdnsDiscovery::builder()
    .advertise(true)
    .service_name("social-id")
    .build(node_id)?;
```
- Discovers peers on the same local network
- Zero-configuration
- Fast local discovery

**2. Pkarr (DNS-based)**
```rust
let endpoint = Endpoint::builder()
    .discovery(iroh::discovery::pkarr::PkarrPublisher::n0_dns())
    // ...
```
- Uses DNS for peer discovery
- Works across different networks
- Maintained by n0.computer

### Connection Protocol

**ALPN**: `social-id/credential/v1`

Each connection follows a request-response pattern:
1. Initiator opens bidirectional stream
2. Sends JSON-serialized `CredentialMessage`
3. Receiver parses message and processes based on role
4. Receiver sends JSON-serialized response
5. Connection closes

### Message Types

```rust
pub enum CredentialMessage {
    // Employee → Issuer
    IssueRequest {
        request_id: String,
        employee_node_id: EndpointId,
        employee_name: String,
        gross_salary: String,
        net_salary: String,
        currency: String,
        pay_period: String,
        payment_mode: PaymentMode,
    },
    
    // Issuer → Employee (Acknowledgment)
    RequestQueued {
        request_id: String,
        message: String,
    },
    
    // Issuer → Employee (Result)
    IssueResponse {
        request_id: String,
        credential: Option<SignedIncomeCredential>,
        error: Option<String>,
    },
    
    // Employee → Verifier
    PresentCredential {
        presentation_id: String,
        credential: SignedIncomeCredential,
    },
    
    // Verifier → Employee
    VerificationResult {
        presentation_id: String,
        is_valid: bool,
        is_trusted: bool,
        issuer_node_id: EndpointId,
        message: String,
    },
    
    // Error handling
    Error {
        request_id: String,
        error_code: String,
        message: String,
    },
}
```

## 🧩 Project Structure

```
trust-triangle/
├── src/                          # Rust backend (WASM)
│   ├── lib.rs                    # Module exports
│   ├── peer_node.rs              # Core P2P node implementation
│   ├── wasm.rs                   # WASM bindings
│   └── credentials/
│       ├── mod.rs
│       └── income_credential.rs  # Credential types & crypto
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── App.tsx              # Main app component
│   │   ├── main.tsx             # Entry point
│   │   ├── components/          # React components
│   │   │   ├── RoleSelection.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── EmployeeView.tsx
│   │   │   ├── IssuerView.tsx
│   │   │   ├── VerifierView.tsx
│   │   │   └── NodeIdDisplay.tsx
│   │   ├── views/
│   │   │   └── wallet/          # Employee-specific views
│   │   │       ├── NodeConfigView.tsx
│   │   │       └── IncomeCredentialView.tsx
│   │   ├── lib/                 # TypeScript libraries
│   │   │   ├── api.ts           # Core API interface
│   │   │   ├── peer-node.ts     # WASM peer node wrapper
│   │   │   ├── log.ts           # Logging utilities
│   │   │   ├── credential-helpers.ts
│   │   │   └── storage/
│   │   │       ├── storage.ts   # App state storage
│   │   │       └── employeeStorage.ts # Employee config
│   │   └── types/
│   │       └── incomeCredential.ts # Type definitions
│   ├── pkg/                     # Generated WASM bindings
│   └── dist/                    # Production build
│
├── docs/                        # Documentation
│   ├── PEER_COMMUNICATION_ARCHITECTURE.md
│   ├── EMPLOYEE_FLOW.md
│   ├── EMPLOYEE_VIEW_IMPLEMENTATION.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   └── INITIAL_LOADER_FLOW.md
│
├── Cargo.toml                   # Rust dependencies
├── package.json                 # Root build scripts
├── Makefile.toml               # Cargo make tasks
└── README.md                    # This file
```

## 🔧 API Reference

### PeerNode (Rust)

**Spawning a Node:**
```rust
let node = PeerNode::spawn(
    Some(secret_key),
    Role::Employee
).await?;
```

**Connecting to Peer:**
```rust
let events = node.connect(
    peer_node_id,
    CredentialMessage::IssueRequest { /* ... */ }
);
```

**Listening for Connections:**
```rust
let mut accept_events = node.accept_events();
while let Some(event) = accept_events.next().await {
    match event {
        AcceptEvent::MessageReceived { node_id, message } => {
            // Handle message
        }
        // ...
    }
}
```

**Issuer Methods:**
```rust
// Get pending requests
let requests = node.get_pending_requests().await;

// Approve a request
node.approve_request(request_id).await?;

// Reject a request
node.reject_request(request_id, Some("Reason".to_string())).await?;
```

**Verifier Methods:**
```rust
// Add trusted issuer
node.add_trusted_issuer(issuer_node_id).await?;

// Check if issuer is trusted
let is_trusted = node.is_trusted_issuer(issuer_node_id).await;

// Get verified credentials
let credentials = node.get_verified_credentials().await;
```

**Employee Methods:**
```rust
// Get received credentials
let credentials = node.get_received_credentials().await;

// Get specific credential
let credential = node.get_received_credential(request_id).await;
```

### WASM API (TypeScript)

**Initialization:**
```typescript
import { api } from './lib/api';

await api.init(role); // 'employee', 'issuer', or 'verifier'
const nodeId = api.getNodeId();
```

**Sending Messages:**
```typescript
const eventStream = api.connect(peerNodeId, message);
for await (const event of eventStream) {
  console.log(event);
}
```

**Receiving Messages:**
```typescript
const subscription = api.subscribeToAcceptEvents((event) => {
  if (event.type === 'messageReceived') {
    console.log('Received:', event.message);
  }
});
```

**State Management:**
```typescript
// Issuer: Get pending requests
const requests = await api.getPendingRequests();

// Issuer: Approve/reject
await api.approveRequest(requestId);
await api.rejectRequest(requestId, reason);

// Verifier: Manage trust
await api.addTrustedIssuer(nodeId);
const issuers = await api.getTrustedIssuers();

// Employee: Get credentials
const credentials = await api.getReceivedCredentials();
```

## 🧪 Testing

### Running Tests

```bash
# Run Rust tests
cargo test

# Run with logging
RUST_LOG=debug cargo test -- --nocapture
```

### Test Coverage

The project includes comprehensive tests for:
- Credential creation and signing
- Signature verification
- Payment mode serialization
- Invalid signature detection
- Payroll processor credentials

### Manual Testing

1. **Local Network Test:**
   - Open app in two browser tabs
   - One as Employee, one as Issuer
   - Request credential in Employee tab
   - Approve in Issuer tab
   - Verify credential received

2. **Cross-Device Test:**
   - Run on two devices on same WiFi
   - mDNS should discover peers automatically
   - Test full credential lifecycle

## 📚 Key Concepts

### Income Credential Structure

```rust
pub struct IncomeCredential {
    pub id: String,
    pub employee_node_id: EndpointId,
    pub employee_name: String,
    pub employer_node_id: EndpointId,
    pub employer_name: String,
    pub payroll_processor_node_id: Option<EndpointId>,
    pub payroll_processor_name: Option<String>,
    pub gross_salary: String,
    pub net_salary: String,
    pub currency: String,
    pub pay_period: String,
    pub payment_mode: PaymentMode,
    pub issued_at: String,
}
```

### Signed Credential

```rust
pub struct SignedIncomeCredential {
    pub credential: IncomeCredential,
    pub signature: Vec<u8>, // 64-byte Ed25519 signature
}
```

### Credential Statement

The signature covers a human-readable statement:
```
"Acme Corporation (did:iroh:...) certifies that John Doe (did:iroh:...)
received a gross salary of 10000.00 USD and net salary of 8000.00 USD
for the pay period 2024-01 via Bank Transfer"
```

## 🛣️ Roadmap

### Phase 1: Core Features ✅
- [x] P2P networking with Iroh
- [x] Employee, Issuer, Verifier roles
- [x] Credential issuance flow
- [x] Signature verification
- [x] Trust management

### Phase 2: Enhanced UX 🚧
- [ ] QR code scanning for node IDs
- [ ] Credential presentation requests
- [ ] Batch credential requests
- [ ] Credential expiry handling
- [ ] Mobile-responsive improvements

### Phase 3: Advanced Features 📋
- [ ] Credential revocation
- [ ] Selective disclosure (ZK proofs)
- [ ] Multi-signature credentials
- [ ] Credential templates
- [ ] Encrypted credential storage

### Phase 4: Enterprise 🏢
- [ ] Organizational issuers
- [ ] Audit logs
- [ ] Compliance reporting
- [ ] API for third-party integration
- [ ] SSO integration

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Rust style guidelines (`cargo fmt`)
- Add tests for new features
- Update documentation
- Use meaningful commit messages
- Keep PRs focused and atomic

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- **[Iroh](https://iroh.computer/)** - P2P networking library by n0
- **[WebAssembly](https://webassembly.org/)** - Portable binary format
- **React** and **TailwindCSS** communities

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation in `docs/`
- Review the [Iroh documentation](https://iroh.computer/docs)

## ⚠️ Disclaimer

This is experimental software. Use at your own risk in production environments. Always audit the code for security before deploying with real credentials.

---

**Built with ❤️ using Rust, WebAssembly, and Iroh**

