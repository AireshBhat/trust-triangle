# Peer Node API

A TypeScript API wrapper for the Trust Triangle WASM peer node module, providing a clean interface for P2P communication between employees, issuers, and verifiers.

## Overview

The API follows a singleton pattern similar to the Iroh chat example, ensuring only one instance of the peer node is created and managed efficiently.

## Files

- **`api.ts`** - Type definitions and API interface
- **`peer-node.ts`** - Main PeerNodeAPI implementation
- **`index.ts`** - Singleton initialization and exports
- **`log.ts`** - Logging system

## Quick Start

### Basic Initialization

```typescript
import { initApi } from './lib';

// Initialize as an employee
const api = await initApi('employee');

// Get node information
const nodeInfo = api.getNodeInfo();
console.log('Node ID:', nodeInfo?.nodeId);
console.log('Role:', nodeInfo?.role);
```

### With Custom Secret Key

```typescript
import { initApi, generateSecretKey } from './lib';

// Generate a new secret key
const secretKey = await generateSecretKey();

// Initialize with the secret key
const api = await initApi('issuer', secretKey);
```

## API Reference

### Initialization Functions

#### `initApi(role: Role, secretKey?: string): Promise<API>`

Initializes the peer node API as a singleton. If already initialized, returns the existing instance.

- **role**: `'employee' | 'issuer' | 'verifier'`
- **secretKey**: Optional hex-encoded secret key
- **Returns**: Promise resolving to the API instance

```typescript
const api = await initApi('employee');
```

#### `resetApi(): void`

Resets the API singleton, allowing for re-initialization.

```typescript
resetApi();
const newApi = await initApi('verifier');
```

#### `generateSecretKey(): Promise<string>`

Generates a new cryptographic secret key.

```typescript
const secretKey = await generateSecretKey();
```

### API Methods

#### `spawn(role: Role, secretKey?: string): Promise<PeerNodeInfo>`

Spawns a new peer node. This is called automatically by `initApi()`.

```typescript
const nodeInfo = await api.spawn('employee');
```

#### `getNodeInfo(): PeerNodeInfo | null`

Gets the current peer node information.

```typescript
const info = api.getNodeInfo();
if (info) {
  console.log('Node ID:', info.nodeId);
  console.log('Secret Key:', info.secretKey);
  console.log('Role:', info.role);
}
```

#### `connect(nodeId: string, payload: string): Promise<void>`

Connects to another peer node and sends a payload.

```typescript
await api.connect(
  'target-node-id-here',
  JSON.stringify({ message: 'Hello!' })
);
```

#### `getConnections(): PeerConnection[]`

Gets all active peer connections.

```typescript
const connections = api.getConnections();
connections.forEach(conn => {
  console.log(`${conn.nodeId}: ${conn.status}`);
});
```

#### `subscribeToAcceptEvents(callback: (event: AcceptEvent) => void): () => void`

Subscribe to incoming connection events.

```typescript
const unsubscribe = api.subscribeToAcceptEvents((event) => {
  switch (event.type) {
    case 'accepted':
      console.log('Connection accepted from:', event.nodeId);
      break;
    case 'echoed':
      console.log('Data echoed to:', event.nodeId);
      break;
    case 'closed':
      console.log('Connection closed:', event.nodeId);
      break;
  }
});

// Later, to unsubscribe
unsubscribe();
```

#### `subscribeToConnections(callback: () => void): () => void`

Subscribe to connection state changes.

```typescript
const unsubscribe = api.subscribeToConnections(() => {
  const connections = api.getConnections();
  console.log(`Active connections: ${connections.length}`);
});
```

#### `isInitialized(): boolean`

Checks if the peer node has been initialized.

```typescript
if (api.isInitialized()) {
  // Ready to use
}
```

## Types

### `Role`
```typescript
type Role = 'employee' | 'issuer' | 'verifier';
```

### `PeerNodeInfo`
```typescript
interface PeerNodeInfo {
  nodeId: string;      // Unique identifier for this node
  secretKey: string;   // Hex-encoded secret key
  role: Role;          // Node's role in the trust triangle
}
```

### `AcceptEvent`
Events fired when accepting incoming connections:

```typescript
type AcceptEvent = 
  | { type: 'accepted'; nodeId: string }
  | { type: 'echoed'; nodeId: string; bytesSent: number }
  | { type: 'closed'; nodeId: string; error?: string };
```

### `ConnectEvent`
Events fired when connecting to another node:

```typescript
type ConnectEvent = 
  | { type: 'connected' }
  | { type: 'sent'; bytesSent: number }
  | { type: 'received'; bytesReceived: number }
  | { type: 'closed'; error?: string };
```

### `PeerConnection`
```typescript
interface PeerConnection {
  nodeId: string;
  status: ConnectionStatus;
  lastActivity: Date;
  error?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
```

## Usage Examples

### React Component - Employee Wallet

```tsx
import { useEffect, useState } from 'react';
import { initApi, type PeerNodeInfo, type AcceptEvent } from './lib';

function EmployeeWallet() {
  const [nodeInfo, setNodeInfo] = useState<PeerNodeInfo | null>(null);
  const [events, setEvents] = useState<AcceptEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const api = await initApi('employee');
        const info = api.getNodeInfo();
        setNodeInfo(info);

        // Subscribe to accept events
        const unsubscribe = api.subscribeToAcceptEvents((event) => {
          setEvents(prev => [...prev, event]);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!nodeInfo) return <div>Failed to initialize</div>;

  return (
    <div>
      <h2>Employee Wallet</h2>
      <p>Node ID: {nodeInfo.nodeId}</p>
      <h3>Events</h3>
      <ul>
        {events.map((event, i) => (
          <li key={i}>
            {event.type} - {event.nodeId}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### React Component - Issuer

```tsx
import { useState, useEffect } from 'react';
import { initApi, type PeerConnection } from './lib';

function IssuerView() {
  const [connections, setConnections] = useState<PeerConnection[]>([]);
  const [targetNodeId, setTargetNodeId] = useState('');
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    const initialize = async () => {
      const apiInstance = await initApi('issuer');
      setApi(apiInstance);

      // Subscribe to connection changes
      const unsubscribe = apiInstance.subscribeToConnections(() => {
        setConnections(apiInstance.getConnections());
      });

      return () => unsubscribe();
    };

    initialize();
  }, []);

  const handleConnect = async () => {
    if (!api || !targetNodeId) return;

    try {
      await api.connect(targetNodeId, JSON.stringify({
        type: 'credential_offer',
        data: { /* credential data */ }
      }));
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <div>
      <h2>Issuer</h2>
      <input
        type="text"
        value={targetNodeId}
        onChange={(e) => setTargetNodeId(e.target.value)}
        placeholder="Enter employee node ID"
      />
      <button onClick={handleConnect}>Issue Credential</button>

      <h3>Connections</h3>
      <ul>
        {connections.map(conn => (
          <li key={conn.nodeId}>
            {conn.nodeId.slice(0, 8)}... - {conn.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### React Component - Verifier

```tsx
import { useEffect, useState } from 'react';
import { initApi, type AcceptEvent } from './lib';

function VerifierView() {
  const [verificationRequests, setVerificationRequests] = useState<AcceptEvent[]>([]);

  useEffect(() => {
    const initialize = async () => {
      const api = await initApi('verifier');
      
      const unsubscribe = api.subscribeToAcceptEvents((event) => {
        if (event.type === 'accepted') {
          // New verification request
          setVerificationRequests(prev => [...prev, event]);
        }
      });

      return () => unsubscribe();
    };

    initialize();
  }, []);

  return (
    <div>
      <h2>Verifier</h2>
      <h3>Verification Requests</h3>
      <ul>
        {verificationRequests.map((req, i) => (
          <li key={i}>
            From: {req.nodeId.slice(0, 8)}...
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Multiple Roles (Testing/Development)

```typescript
import { PeerNodeAPI } from './lib/peer-node';

// Create separate instances for testing
const employeeAPI = new PeerNodeAPI();
const issuerAPI = new PeerNodeAPI();

await employeeAPI.spawn('employee');
await issuerAPI.spawn('issuer');

// Connect issuer to employee
const employeeNodeId = employeeAPI.getNodeInfo()!.nodeId;
await issuerAPI.connect(employeeNodeId, JSON.stringify({
  type: 'credential_offer',
  credential: { /* ... */ }
}));
```

## Error Handling

```typescript
try {
  const api = await initApi('employee');
  await api.connect(nodeId, payload);
} catch (error) {
  if (error instanceof Error) {
    console.error('Connection failed:', error.message);
  }
}
```

## Best Practices

1. **Initialize Once**: Use the singleton pattern via `initApi()` to ensure one peer node per app
2. **Store Secret Keys**: Persist secret keys securely to maintain the same node ID across sessions
3. **Handle Events**: Always subscribe to accept events to know when peers connect
4. **Clean Up**: Unsubscribe from events when components unmount
5. **Error Handling**: Wrap async operations in try-catch blocks
6. **Connection Tracking**: Use `subscribeToConnections()` to track active peers

## Architecture

```
┌─────────────┐
│  React App  │
└──────┬──────┘
       │ initApi()
       ▼
┌─────────────┐
│  index.ts   │ (Singleton)
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ peer-node.ts │ (PeerNodeAPI)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  WASM Module │ (trust-triangle)
└──────────────┘
```

## Notes

- The WASM module is automatically initialized on first import
- All communication is P2P using the Iroh networking library
- Node IDs are deterministically derived from secret keys
- The API handles connection lifecycle and event management internally

