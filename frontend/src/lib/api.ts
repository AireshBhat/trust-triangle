export type Role = 'employee' | 'issuer' | 'verifier';

export interface PeerNodeInfo {
  nodeId: string;
  secretKey: string;
  role: Role;
}

export type ConnectEvent = 
  | { type: 'connected' }
  | { type: 'sent'; bytesSent: number }
  | { type: 'received'; bytesReceived: number }
  | { type: 'closed'; error?: string };

export type AcceptEvent = 
  | { type: 'accepted'; nodeId: string }
  | { type: 'echoed'; nodeId: string; bytesSent: number }
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
}

