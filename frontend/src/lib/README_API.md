# Trust Triangle Frontend API

This document describes the updated frontend API with full credential issuance and verification support.

## Overview

The frontend API provides TypeScript bindings for the Rust peer-to-peer communication layer with role-based credential handling for Employee, Issuer, and Verifier nodes.

## Installation & Setup

```typescript
import { initApi, generateSecretKey } from './lib';

// Initialize a node with a role
const api = await initApi('employee'); // or 'issuer' or 'verifier'

// Or with a persistent secret key
const secretKey = await generateSecretKey();
const api = await initApi('employee', secretKey);
```

## Core API Methods

### Common Methods (All Roles)

```typescript
interface API {
  // Node information
  getNodeInfo(): PeerNodeInfo | null;
  isInitialized(): boolean;
  
  // Connection management
  connect(nodeId: string, payload: string): Promise<void>;
  getConnections(): PeerConnection[];
  
  // Event subscriptions
  subscribeToAcceptEvents(callback: (event: AcceptEvent) => void): () => void;
  subscribeToConnections(callback: () => void): () => void;
  
  // Role-specific methods
  // Issuer methods
  getPendingRequests(): Promise<PendingCredentialRequest[]>;
  approveRequest(requestId: string): Promise<void>;
  rejectRequest(requestId: string, reason?: string): Promise<void>;
  
  // Verifier methods
  addTrustedIssuer(nodeId: string): Promise<void>;
  removeTrustedIssuer(nodeId: string): Promise<void>;
  isTrustedIssuer(nodeId: string): Promise<boolean>;
  getTrustedIssuers(): Promise<string[]>;
}
```

## Role-Based Workflows

### 1. Employee Workflow

**Step 1: Request Credential from Issuer**

```typescript
import { initApi, createIssueRequest, generateRequestId } from './lib';

const api = await initApi('employee');
const nodeInfo = api.getNodeInfo();

// Create and send credential request
const requestPayload = createIssueRequest({
  requestId: generateRequestId(),
  employeeNodeId: nodeInfo!.nodeId,
  employeeName: 'John Doe',
  grossSalary: '120000.00',
  netSalary: '95000.00',
  currency: 'USD',
  payPeriod: '2024-10',
  paymentMode: 'bank_transfer',
});

await api.connect(issuerNodeId, requestPayload);
```

**Step 2: Listen for Credential Response**

```typescript
api.subscribeToAcceptEvents((event) => {
  if (event.type === 'messageReceived') {
    if (event.message.type === 'issueResponse') {
      if (event.message.credential) {
        console.log('Credential received!', event.message.credential);
        // Store the credential locally
      } else {
        console.error('Request rejected:', event.message.error);
      }
    }
  }
});
```

**Step 3: Present Credential to Verifier**

```typescript
import { createPresentCredential } from './lib';

const presentationPayload = createPresentCredential({
  presentationId: generateRequestId(),
  credential: storedCredential,
});

await api.connect(verifierNodeId, presentationPayload);
```

### 2. Issuer Workflow

**Step 1: Listen for Incoming Requests**

```typescript
const api = await initApi('issuer');

api.subscribeToAcceptEvents((event) => {
  if (event.type === 'messageReceived' && event.message.type === 'issueRequest') {
    console.log('New credential request:', event.message);
    // Request is automatically queued
  }
  if (event.type === 'responseSent' && event.message.type === 'requestQueued') {
    console.log('Request queued confirmation sent');
  }
});
```

**Step 2: Review Pending Requests**

```typescript
const pendingRequests = await api.getPendingRequests();

pendingRequests.forEach(request => {
  console.log(`Request from ${request.employeeName}`);
  console.log(`Salary: ${request.grossSalary} ${request.currency}`);
  console.log(`Status: ${request.status}`);
});
```

**Step 3: Approve or Reject Requests**

```typescript
// Approve a request (credential is automatically created, signed, and sent)
await api.approveRequest(requestId);

// Or reject with reason
await api.rejectRequest(requestId, 'Insufficient verification');
```

### 3. Verifier Workflow

**Step 1: Configure Trusted Issuers**

```typescript
const api = await initApi('verifier');

// Add trusted issuer
await api.addTrustedIssuer(issuerNodeId);

// Get all trusted issuers
const trustedIssuers = await api.getTrustedIssuers();

// Check if specific issuer is trusted
const isTrusted = await api.isTrustedIssuer(issuerNodeId);
```

**Step 2: Listen for Verification Requests**

```typescript
api.subscribeToAcceptEvents((event) => {
  if (event.type === 'messageReceived' && event.message.type === 'presentCredential') {
    console.log('Credential presented for verification');
    // Verification happens automatically
  }
  
  if (event.type === 'responseSent' && event.message.type === 'verificationResult') {
    const result = event.message;
    console.log(`Verification result:`);
    console.log(`- Valid signature: ${result.isValid}`);
    console.log(`- Trusted issuer: ${result.isTrusted}`);
    console.log(`- Issuer: ${result.issuerNodeId}`);
  }
});
```

**Step 3: Manage Trust List**

```typescript
// Remove an issuer from trust list
await api.removeTrustedIssuer(issuerNodeId);
```

## Types

### Credential Message Types

```typescript
type CredentialMessage =
  | { type: 'issueRequest'; ... }
  | { type: 'requestQueued'; ... }
  | { type: 'issueResponse'; credential?: SignedIncomeCredential; error?: string }
  | { type: 'presentCredential'; credential: SignedIncomeCredential }
  | { type: 'verificationResult'; isValid: boolean; isTrusted: boolean; ... }
  | { type: 'error'; ... };
```

### Credential Structure

```typescript
interface SignedIncomeCredential {
  credential: {
    id: string;
    employeeNodeId: string;
    employeeName: string;
    employerNodeId: string;
    employerName: string;
    payrollProcessorNodeId?: string;
    payrollProcessorName?: string;
    grossSalary: string;
    netSalary: string;
    currency: string;
    payPeriod: string; // YYYY-MM format
    paymentMode: PaymentMode;
    issuedAt: string; // ISO 8601 timestamp
  };
  signature: number[]; // Ed25519 signature (64 bytes)
}

type PaymentMode = 'bank_transfer' | 'crypto' | 'check' | 'cash' | 'other';
```

### Pending Request Structure

```typescript
interface PendingCredentialRequest {
  requestId: string;
  employeeNodeId: string;
  employeeName: string;
  grossSalary: string;
  netSalary: string;
  currency: string;
  payPeriod: string;
  paymentMode: PaymentMode;
  requestedAt: string; // ISO 8601 timestamp
  status: 'pending' | 'approved' | 'rejected';
}
```

### Event Types

```typescript
// Events received when accepting connections
type AcceptEvent =
  | { type: 'accepted'; nodeId: string }
  | { type: 'messageReceived'; nodeId: string; message: CredentialMessage }
  | { type: 'responseSent'; nodeId: string; message: CredentialMessage; bytesSent: number }
  | { type: 'closed'; nodeId: string; error?: string };

// Events received when initiating connections
type ConnectEvent =
  | { type: 'connected' }
  | { type: 'messageSent'; message: CredentialMessage; bytesSent: number }
  | { type: 'responseReceived'; message: CredentialMessage; bytesReceived: number }
  | { type: 'closed'; error?: string };
```

## Helper Functions

### Message Creation

```typescript
import { createIssueRequest, createPresentCredential, generateRequestId } from './lib';

// Generate unique IDs
const requestId = generateRequestId();

// Create credential request
const requestPayload = createIssueRequest({ ... });

// Create credential presentation
const presentationPayload = createPresentCredential({ ... });
```

### Formatting & Validation

```typescript
import { 
  formatSalary, 
  formatPaymentMode, 
  formatPayPeriod,
  validateSalary,
  validatePayPeriod 
} from './lib';

// Format for display
const formatted = formatSalary('120000.00', 'USD'); // "$120,000.00"
const mode = formatPaymentMode('bank_transfer'); // "Bank Transfer"
const period = formatPayPeriod('2024-10'); // "October 2024"

// Validate input
const isValidAmount = validateSalary('120000.00');
const isValidPeriod = validatePayPeriod('2024-10');
```

## Security Considerations

1. **Secret Key Storage**: Store secret keys securely (localStorage, secure storage, etc.)
2. **Trust Management**: Verifiers should carefully manage their trusted issuer list
3. **Credential Storage**: Employees should securely store received credentials
4. **Network Security**: Iroh provides encrypted peer-to-peer connections
5. **Signature Verification**: Credentials are cryptographically signed with Ed25519

## Example: Complete Flow

```typescript
// 1. Employee requests credential
const employeeApi = await initApi('employee');
const requestPayload = createIssueRequest({
  requestId: generateRequestId(),
  employeeNodeId: employeeApi.getNodeInfo()!.nodeId,
  employeeName: 'Alice',
  grossSalary: '100000',
  netSalary: '80000',
  currency: 'USD',
  payPeriod: '2024-10',
  paymentMode: 'bank_transfer',
});
await employeeApi.connect(issuerNodeId, requestPayload);

// 2. Issuer reviews and approves
const issuerApi = await initApi('issuer');
const requests = await issuerApi.getPendingRequests();
await issuerApi.approveRequest(requests[0].requestId);

// 3. Employee receives credential and presents to verifier
let credential: SignedIncomeCredential;
employeeApi.subscribeToAcceptEvents((event) => {
  if (event.type === 'messageReceived' && event.message.type === 'issueResponse') {
    credential = event.message.credential!;
    
    // Present to verifier
    const presentPayload = createPresentCredential({
      presentationId: generateRequestId(),
      credential,
    });
    employeeApi.connect(verifierNodeId, presentPayload);
  }
});

// 4. Verifier verifies credential
const verifierApi = await initApi('verifier');
await verifierApi.addTrustedIssuer(issuerNodeId);

verifierApi.subscribeToAcceptEvents((event) => {
  if (event.type === 'responseSent' && event.message.type === 'verificationResult') {
    console.log('Verified:', event.message.isValid && event.message.isTrusted);
  }
});
```

## See Also

- `example.ts` - More comprehensive examples
- `credential-helpers.ts` - Helper functions
- `api.ts` - Full type definitions
- `peer-node.ts` - Implementation details

