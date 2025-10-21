/**
 * Example usage of the Peer Node API
 * This file demonstrates how to use the API in your application
 */

import { 
  initApi, 
  generateSecretKey, 
  createIssueRequest,
  createPresentCredential,
  generateRequestId,
  type AcceptEvent, 
  type SignedIncomeCredential,
} from './index';

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
      case 'messageReceived':
        console.log('Received message from:', event.nodeId, event.message.type);
        break;
      case 'responseSent':
        console.log('Sent response to:', event.nodeId, event.message.type);
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

// Example 2: Employee requests a credential from issuer
export async function exampleEmployeeRequestCredential(issuerNodeId: string) {
  // Initialize as employee
  const api = await initApi('employee');
  const nodeInfo = api.getNodeInfo();
  
  if (!nodeInfo) {
    throw new Error('Failed to get node info');
  }
  
  // Create a credential request
  const requestId = generateRequestId();
  const requestPayload = createIssueRequest({
    requestId,
    employeeNodeId: nodeInfo.nodeId,
    employeeName: 'John Doe',
    grossSalary: '120000.00',
    netSalary: '95000.00',
    currency: 'USD',
    payPeriod: '2024-10',
    paymentMode: 'bank_transfer',
  });
  
  // Send request to issuer
  await api.connect(issuerNodeId, requestPayload);
  console.log('Credential request sent to issuer');
  
  // Listen for the response (issuer will initiate connection back to us)
  api.subscribeToAcceptEvents(async (event) => {
    if (event.type === 'messageReceived' && event.message.type === 'issueResponse') {
      console.log('Received credential response!');
      
      // Check if approved or rejected
      const response = await api.getReceivedCredential(requestId);
      if (response?.credential) {
        console.log('Credential approved and stored!', response.credential);
      } else {
        console.log('Credential rejected:', response?.error);
      }
    }
  });
  
  return api;
}

// Example 2b: Employee checks received credentials
export async function exampleEmployeeCheckCredentials() {
  const api = await initApi('employee');
  
  // Get all received credentials
  const allCredentials = await api.getReceivedCredentials();
  console.log(`You have ${allCredentials.length} received credentials`);
  
  allCredentials.forEach(response => {
    if (response.credential) {
      console.log(`✅ Approved: ${response.credential.credential.employeeName}`);
      console.log(`   Salary: ${response.credential.credential.netSalary} ${response.credential.credential.currency}`);
      console.log(`   Issued by: ${response.issuerNodeId}`);
    } else {
      console.log(`❌ Rejected: ${response.error}`);
    }
  });
  
  return api;
}

// Example 3: Issuer manages pending requests
export async function exampleIssuerManageRequests() {
  // Initialize as issuer
  const api = await initApi('issuer');
  
  // Get all pending requests
  const pendingRequests = await api.getPendingRequests();
  console.log('Pending requests:', pendingRequests);
  
  // Approve a request
  if (pendingRequests.length > 0) {
    const request = pendingRequests[0];
    console.log(`Approving request from ${request.employeeName}`);
    await api.approveRequest(request.requestId);
  }
  
  // Or reject a request
  // await api.rejectRequest(request.requestId, 'Insufficient verification');
  
  return api;
}

// Example 4: Verifier manages trusted issuers and verifies credentials
export async function exampleVerifierManageTrust(trustedIssuerNodeId: string) {
  const api = await initApi('verifier');
  
  // Add a trusted issuer
  await api.addTrustedIssuer(trustedIssuerNodeId);
  console.log('Added trusted issuer:', trustedIssuerNodeId);
  
  // Get all trusted issuers
  const trustedIssuers = await api.getTrustedIssuers();
  console.log('Trusted issuers:', trustedIssuers);
  
  // Check if an issuer is trusted
  const isTrusted = await api.isTrustedIssuer(trustedIssuerNodeId);
  console.log('Is trusted:', isTrusted);
  
  // Listen for verification requests
  api.subscribeToAcceptEvents((event: AcceptEvent) => {
    if (event.type === 'messageReceived' && event.message.type === 'presentCredential') {
      console.log('Verification request from:', event.nodeId);
      // The verification happens automatically and a response is sent
    }
    if (event.type === 'responseSent' && event.message.type === 'verificationResult') {
      console.log('Verification result sent:', event.message);
    }
  });
  
  return api;
}

// Example 5: Employee presents credential to verifier
export async function exampleEmployeePresentCredential(
  verifierNodeId: string,
  credential: SignedIncomeCredential
) {
  const api = await initApi('employee');
  
  // Create presentation request
  const presentationPayload = createPresentCredential({
    presentationId: generateRequestId(),
    credential: credential,
  });
  
  // Send to verifier
  await api.connect(verifierNodeId, presentationPayload);
  console.log('Credential presented to verifier');
  
  return api;
}

// Example 6: Generate and persist secret key
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

// Example 7: React Hook pattern
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

