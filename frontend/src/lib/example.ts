/**
 * Example usage of the Peer Node API
 * This file demonstrates how to use the API in your application
 */

import { initApi, generateSecretKey, type AcceptEvent, type PeerConnection } from './index';

// Example 1: Initialize as an employee
export async function exampleEmployeeInit() {
  // Initialize the peer node
  const api = await initApi('employee');
  
  // Get node information
  const nodeInfo = api.getNodeInfo();
  console.log('Employee Node ID:', nodeInfo?.nodeId);
  console.log('Secret Key:', nodeInfo?.secretKey);
  
  // Subscribe to incoming connections
  const unsubscribe = api.subscribeToAcceptEvents((event: AcceptEvent) => {
    switch (event.type) {
      case 'accepted':
        console.log('Issuer connected:', event.nodeId);
        break;
      case 'echoed':
        console.log('Received credential from:', event.nodeId);
        break;
      case 'closed':
        console.log('Connection closed:', event.nodeId);
        if (event.error) {
          console.error('Error:', event.error);
        }
        break;
    }
  });
  
  // Remember to unsubscribe when done
  return { api, unsubscribe };
}

// Example 2: Initialize as an issuer and connect to employee
export async function exampleIssuerConnect(employeeNodeId: string) {
  // Initialize as issuer
  const api = await initApi('issuer');
  
  // Track connections
  api.subscribeToConnections(() => {
    const connections = api.getConnections();
    console.log('Active connections:', connections.length);
    connections.forEach((conn: PeerConnection) => {
      console.log(`- ${conn.nodeId}: ${conn.status}`);
    });
  });
  
  // Connect to employee and send credential offer
  const credentialOffer = {
    type: 'credential_offer',
    credential: {
      employeeName: 'John Doe',
      position: 'Software Engineer',
      department: 'Engineering',
      // ... other fields
    }
  };
  
  await api.connect(employeeNodeId, JSON.stringify(credentialOffer));
  console.log('Credential offer sent to employee');
  
  return api;
}

// Example 3: Initialize as a verifier
export async function exampleVerifierInit() {
  const api = await initApi('verifier');
  
  // Listen for verification requests
  api.subscribeToAcceptEvents((event: AcceptEvent) => {
    if (event.type === 'accepted') {
      console.log('Verification request from:', event.nodeId);
      // Process verification request
    }
  });
  
  return api;
}

// Example 4: Generate and persist secret key
export async function examplePersistentNode() {
  // Check if we have a stored secret key
  const storedKey = localStorage.getItem('peerNodeSecretKey');
  
  let secretKey: string;
  if (storedKey) {
    // Use existing key to maintain same node ID
    secretKey = storedKey;
    console.log('Using existing secret key');
  } else {
    // Generate new key
    secretKey = await generateSecretKey();
    localStorage.setItem('peerNodeSecretKey', secretKey);
    console.log('Generated new secret key');
  }
  
  // Initialize with the secret key
  const api = await initApi('employee', secretKey);
  const nodeInfo = api.getNodeInfo();
  console.log('Node ID (will be same on reload):', nodeInfo?.nodeId);
  
  return api;
}

// Example 5: React Hook pattern
export function useExample() {
  // This is a conceptual example - actual implementation would use React hooks
  
  const initialize = async () => {
    const api = await initApi('employee');
    
    // Subscribe and handle cleanup
    const unsubscribe = api.subscribeToAcceptEvents((event) => {
      // Handle events
      console.log('Event:', event);
    });
    
    // Return cleanup function
    return () => {
      unsubscribe();
    };
  };
  
  return { initialize };
}

