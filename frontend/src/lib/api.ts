export type Role = 'employee' | 'issuer' | 'verifier';

export interface PeerNodeInfo {
  nodeId: string;
  secretKey: string;
  role: Role;
}

// Credential Message Types
export type PaymentMode = 'bank_transfer' | 'crypto' | 'check' | 'cash' | 'other';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface PendingCredentialRequest {
  requestId: string;
  employeeNodeId: string;
  employeeName: string;
  grossSalary: string;
  netSalary: string;
  currency: string;
  payPeriod: string;
  paymentMode: PaymentMode;
  requestedAt: string;
  status: RequestStatus;
}

export interface ReceivedCredentialResponse {
  requestId: string;
  credential?: SignedIncomeCredential;
  error?: string;
  receivedAt: string;
  issuerNodeId: string;
}

export interface SignedIncomeCredential {
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
    payPeriod: string;
    paymentMode: PaymentMode;
    issuedAt: string;
  };
  signature: number[]; // Vec<u8> from Rust
}

export type CredentialMessage =
  | {
      type: 'issueRequest';
      requestId: string;
      employeeNodeId: string;
      employeeName: string;
      grossSalary: string;
      netSalary: string;
      currency: string;
      payPeriod: string;
      paymentMode: PaymentMode;
    }
  | {
      type: 'requestQueued';
      requestId: string;
      message: string;
    }
  | {
      type: 'issueResponse';
      requestId: string;
      credential?: SignedIncomeCredential;
      error?: string;
    }
  | {
      type: 'presentCredential';
      presentationId: string;
      credential: SignedIncomeCredential;
    }
  | {
      type: 'verificationResult';
      presentationId: string;
      isValid: boolean;
      isTrusted: boolean;
      issuerNodeId: string;
      message: string;
    }
  | {
      type: 'error';
      requestId: string;
      errorCode: string;
      message: string;
    };

// Updated Event Types
export type ConnectEvent =
  | { type: 'connected' }
  | { type: 'messageSent'; message: CredentialMessage; bytesSent: number }
  | { type: 'responseReceived'; message: CredentialMessage; bytesReceived: number }
  | { type: 'closed'; error?: string };

export type AcceptEvent =
  | { type: 'accepted'; nodeId: string }
  | { type: 'messageReceived'; nodeId: string; message: CredentialMessage }
  | { type: 'responseSent'; nodeId: string; message: CredentialMessage; bytesSent: number }
  | { type: 'closed'; nodeId: string; error?: string };

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface PeerConnection {
  nodeId: string;
  status: ConnectionStatus;
  lastActivity: Date;
  error?: string;
}

export interface API {
  spawn(role: Role, secretKey?: string): Promise<PeerNodeInfo>;
  getNodeInfo(): PeerNodeInfo | null;
  connect(nodeId: string, payload: string): Promise<void>;
  getConnections(): PeerConnection[];
  subscribeToAcceptEvents(callback: (event: AcceptEvent) => void): () => void;
  subscribeToConnections(callback: () => void): () => void;
  isInitialized(): boolean;

  // Issuer methods
  getPendingRequests(): Promise<PendingCredentialRequest[]>;
  approveRequest(requestId: string): Promise<void>;
  rejectRequest(requestId: string, reason?: string): Promise<void>;

  // Verifier methods
  addTrustedIssuer(nodeId: string): Promise<void>;
  removeTrustedIssuer(nodeId: string): Promise<void>;
  isTrustedIssuer(nodeId: string): Promise<boolean>;
  getTrustedIssuers(): Promise<string[]>;

  // Employee methods
  getReceivedCredentials(): Promise<ReceivedCredentialResponse[]>;
  getReceivedCredential(requestId: string): Promise<ReceivedCredentialResponse | null>;
}

