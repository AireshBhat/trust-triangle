import { PeerNode, generate_key } from 'trust-triangle';
import { log } from './log';
import type { 
  API, 
  PeerNodeInfo, 
  Role, 
  AcceptEvent,
  ConnectEvent,
  PeerConnection,
  PendingCredentialRequest,
  ReceivedCredentialResponse,
  VerifiedCredentialRecord,
} from './api';

type PeerNodeState = {
  peerNode: PeerNode;
  info: PeerNodeInfo;
  connections: Map<string, PeerConnection>;
  acceptEventSubscribers: ((event: AcceptEvent) => void)[];
  connectionSubscribers: (() => void)[];
  onClose?: () => void;
};

export class PeerNodeAPI implements API {
  private state: PeerNodeState | null = null;

  private constructor() {}

  static async create(role: Role, secretKey?: string): Promise<PeerNodeAPI> {
    log.info(`Spawning peer node with role: ${role}`);
    const api = new PeerNodeAPI();
    await api.spawn(role, secretKey);
    return api;
  }

  async spawn(role: Role, secretKey?: string): Promise<PeerNodeInfo> {
    if (this.state) {
      throw new Error('Peer node already spawned');
    }

    try {
      const peerNode = await PeerNode.spawn(secretKey ?? null, role);
      const nodeId = peerNode.node_id();
      const key = peerNode.secret_key();
      
      log.info(`Peer node spawned. Node ID: ${nodeId}`);

      const info: PeerNodeInfo = {
        nodeId,
        secretKey: key,
        role,
      };

      let onClose: (() => void) | undefined;
      const onClosePromise = new Promise<void>(resolve => {
        onClose = resolve;
      });

      this.state = {
        peerNode,
        info,
        connections: new Map(),
        acceptEventSubscribers: [],
        connectionSubscribers: [],
        onClose,
      };

      // Start listening to accept events
      this.listenToAcceptEvents(onClosePromise);

      return info;
    } catch (error) {
      log.error('Failed to spawn peer node', error);
      throw error;
    }
  }

  private async listenToAcceptEvents(closePromise: Promise<void>) {
    if (!this.state) return;

    const eventStream = this.state.peerNode.events();
    const reader = eventStream.getReader() as ReadableStreamDefaultReader<AcceptEvent>;

    const readLoop = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const event = value;
        log.info(`Accept event received: ${event.type}`);

        // Update connection state based on event
        this.handleAcceptEvent(event);

        // Notify subscribers
        if (this.state) {
          for (const subscriber of this.state.acceptEventSubscribers) {
            subscriber(event);
          }
        }
      }
    };

    Promise.race([closePromise, readLoop()]);
  }

  private handleAcceptEvent(event: AcceptEvent) {
    if (!this.state) return;

    switch (event.type) {
      case 'accepted': {
        const connection: PeerConnection = {
          nodeId: event.nodeId,
          status: 'connected',
          lastActivity: new Date(),
        };
        this.state.connections.set(event.nodeId, connection);
        this.notifyConnectionSubscribers();
        break;
      }
      case 'messageReceived': {
        const connection = this.state.connections.get(event.nodeId);
        if (connection) {
          connection.lastActivity = new Date();
        }
        log.info(`Message received from ${event.nodeId}: ${event.message.type}`);
        break;
      }
      case 'responseSent': {
        const connection = this.state.connections.get(event.nodeId);
        if (connection) {
          connection.lastActivity = new Date();
        }
        log.info(`Response sent to ${event.nodeId}: ${event.message.type}`);
        break;
      }
      case 'closed': {
        const connection = this.state.connections.get(event.nodeId);
        if (connection) {
          connection.status = event.error ? 'error' : 'disconnected';
          connection.error = event.error;
          connection.lastActivity = new Date();
        }
        this.notifyConnectionSubscribers();
        break;
      }
    }
  }

  async connect(nodeId: string, payload: string): Promise<void> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    log.info(`Connecting to node: ${nodeId}`);

    try {
      // Add connection to state
      const connection: PeerConnection = {
        nodeId,
        status: 'connecting',
        lastActivity: new Date(),
      };
      this.state.connections.set(nodeId, connection);
      this.notifyConnectionSubscribers();

      const connectStream = this.state.peerNode.connect(nodeId, payload);
      const reader = connectStream.getReader() as ReadableStreamDefaultReader<ConnectEvent>;

      // Listen to connection events in the background
      const listenToConnectionEvents = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const event = value;
          log.info(`Connect event: ${event.type}`);

          const conn = this.state?.connections.get(nodeId);
          if (!conn) continue;

          switch (event.type) {
            case 'connected':
              conn.status = 'connected';
              conn.lastActivity = new Date();
              break;
            case 'messageSent':
              conn.lastActivity = new Date();
              log.info(`Message sent: ${event.message.type}`);
              break;
            case 'responseReceived':
              conn.lastActivity = new Date();
              log.info(`Response received: ${event.message.type}`);
              break;
            case 'closed':
              conn.status = event.error ? 'error' : 'disconnected';
              conn.error = event.error;
              conn.lastActivity = new Date();
              break;
          }
          this.notifyConnectionSubscribers();
        }
      };

      listenToConnectionEvents();
    } catch (error) {
      log.error('Failed to connect', error);
      const connection = this.state.connections.get(nodeId);
      if (connection) {
        connection.status = 'error';
        connection.error = error instanceof Error ? error.message : 'Unknown error';
      }
      this.notifyConnectionSubscribers();
      throw error;
    }
  }

  getNodeInfo(): PeerNodeInfo | null {
    return this.state ? { ...this.state.info } : null;
  }

  getConnections(): PeerConnection[] {
    if (!this.state) return [];
    return Array.from(this.state.connections.values()).map(conn => ({ ...conn }));
  }

  subscribeToAcceptEvents(callback: (event: AcceptEvent) => void): () => void {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    this.state.acceptEventSubscribers.push(callback);
    
    return () => {
      if (this.state) {
        this.state.acceptEventSubscribers = this.state.acceptEventSubscribers.filter(
          cb => cb !== callback
        );
      }
    };
  }

  subscribeToConnections(callback: () => void): () => void {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    this.state.connectionSubscribers.push(callback);
    
    return () => {
      if (this.state) {
        this.state.connectionSubscribers = this.state.connectionSubscribers.filter(
          cb => cb !== callback
        );
      }
    };
  }

  private notifyConnectionSubscribers() {
    if (!this.state) return;
    for (const subscriber of this.state.connectionSubscribers) {
      subscriber();
    }
  }

  isInitialized(): boolean {
    return this.state !== null;
  }

  async close(): Promise<void> {
    if (!this.state) return;
    
    log.info('Closing peer node');
    
    if (this.state.onClose) {
      this.state.onClose();
    }
    
    this.state = null;
  }

  // Issuer methods

  async getPendingRequests(): Promise<PendingCredentialRequest[]> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      const requestsJson = await this.state.peerNode.get_pending_requests();
      const requests = JSON.parse(requestsJson) as PendingCredentialRequest[];
      log.info(`Retrieved ${requests.length} pending requests`);
      return requests;
    } catch (error) {
      log.error('Failed to get pending requests', error);
      throw error;
    }
  }

  async approveRequest(requestId: string): Promise<void> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      log.info(`Approving request: ${requestId}`);
      await this.state.peerNode.approve_request(requestId);
      log.info(`Request ${requestId} approved successfully`);
    } catch (error) {
      log.error('Failed to approve request', error);
      throw error;
    }
  }

  async rejectRequest(requestId: string, reason?: string): Promise<void> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      log.info(`Rejecting request: ${requestId}`);
      await this.state.peerNode.reject_request(requestId, reason ?? null);
      log.info(`Request ${requestId} rejected successfully`);
    } catch (error) {
      log.error('Failed to reject request', error);
      throw error;
    }
  }

  // Verifier methods

  async addTrustedIssuer(nodeId: string): Promise<void> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      log.info(`Adding trusted issuer: ${nodeId}`);
      await this.state.peerNode.add_trusted_issuer(nodeId);
      log.info(`Issuer ${nodeId} added to trusted list`);
    } catch (error) {
      log.error('Failed to add trusted issuer', error);
      throw error;
    }
  }

  async removeTrustedIssuer(nodeId: string): Promise<void> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      log.info(`Removing trusted issuer: ${nodeId}`);
      await this.state.peerNode.remove_trusted_issuer(nodeId);
      log.info(`Issuer ${nodeId} removed from trusted list`);
    } catch (error) {
      log.error('Failed to remove trusted issuer', error);
      throw error;
    }
  }

  async isTrustedIssuer(nodeId: string): Promise<boolean> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      const isTrusted = await this.state.peerNode.is_trusted_issuer(nodeId);
      return isTrusted;
    } catch (error) {
      log.error('Failed to check if issuer is trusted', error);
      throw error;
    }
  }

  async getTrustedIssuers(): Promise<string[]> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      const issuersJson = await this.state.peerNode.get_trusted_issuers();
      const issuers = JSON.parse(issuersJson) as string[];
      log.info(`Retrieved ${issuers.length} trusted issuers`);
      return issuers;
    } catch (error) {
      log.error('Failed to get trusted issuers', error);
      throw error;
    }
  }

  async getVerifiedCredentials(): Promise<VerifiedCredentialRecord[]> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      const credentialsJson = await this.state.peerNode.get_verified_credentials();
      const credentials = JSON.parse(credentialsJson) as VerifiedCredentialRecord[];
      log.info(`Retrieved ${credentials.length} verified credentials`);
      return credentials;
    } catch (error) {
      log.error('Failed to get verified credentials', error);
      throw error;
    }
  }

  async getVerifiedCredential(presentationId: string): Promise<VerifiedCredentialRecord | null> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      const credentialJson = await this.state.peerNode.get_verified_credential(presentationId);
      if (credentialJson) {
        return JSON.parse(credentialJson) as VerifiedCredentialRecord;
      }
      return null;
    } catch (error) {
      log.error('Failed to get verified credential', error);
      throw error;
    }
  }

  // Employee methods

  async getReceivedCredentials(): Promise<ReceivedCredentialResponse[]> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      const credentialsJson = await this.state.peerNode.get_received_credentials();
      const credentials = JSON.parse(credentialsJson) as ReceivedCredentialResponse[];
      log.info(`Retrieved ${credentials.length} received credentials`);
      return credentials;
    } catch (error) {
      log.error('Failed to get received credentials', error);
      throw error;
    }
  }

  async getReceivedCredential(requestId: string): Promise<ReceivedCredentialResponse | null> {
    if (!this.state) {
      throw new Error('Peer node not initialized. Call spawn() first.');
    }

    try {
      const credentialJson = await this.state.peerNode.get_received_credential(requestId);
      if (credentialJson) {
        const credential = JSON.parse(credentialJson) as ReceivedCredentialResponse;
        log.info(`Retrieved credential for request ${requestId}`);
        return credential;
      }
      return null;
    } catch (error) {
      log.error('Failed to get received credential', error);
      throw error;
    }
  }
}

// Helper function to generate a new secret key
export async function generateSecretKey(): Promise<string> {
  try {
    const key = await generate_key();
    return key;
  } catch (error) {
    log.error('Failed to generate secret key', error);
    throw error;
  }
}
