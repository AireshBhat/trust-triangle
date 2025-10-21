import { useState, useEffect } from 'react';
import RoleSelection from './components/RoleSelection';
import EmployeeView from './components/EmployeeView';
import IssuerView from './components/IssuerView';
import VerifierView from './components/VerifierView';
import LoadingScreen from './components/LoadingScreen';
import { storage, type NodeState } from './lib/storage/storage';
import { initApi, resetApi, type Role } from './lib';
import { log } from './lib/log';

type AppState = 
  | { status: 'loading' }
  | { status: 'role-selection' }
  | { status: 'initializing-node'; role: Role }
  | { status: 'ready'; role: Role; nodeState: NodeState };

function App() {
  const [appState, setAppState] = useState<AppState>({ status: 'loading' });

  // Load local state on app start
  useEffect(() => {
    loadLocalState();
  }, []);

  const loadLocalState = async () => {
    try {
      log.info('Loading local state...');
      
      // Check if we have a saved node state
      const savedNodeState = await storage.loadNodeState();
      
      if (savedNodeState) {
        log.info(`Found saved node state for role: ${savedNodeState.role}`);
        
        // Initialize the API with the saved state
        setAppState({ status: 'initializing-node', role: savedNodeState.role });
        
        try {
          await initApi(savedNodeState.role, savedNodeState.secretKey);
          log.info('Node initialized successfully');
          
          setAppState({
            status: 'ready',
            role: savedNodeState.role,
            nodeState: savedNodeState
          });
        } catch (error) {
          log.error('Failed to initialize node with saved state', error);
          // Clear invalid state and show role selection
          await storage.clearNodeState();
          setAppState({ status: 'role-selection' });
        }
      } else {
        log.info('No saved state found, showing role selection');
        setAppState({ status: 'role-selection' });
      }
    } catch (error) {
      log.error('Error loading local state', error);
      setAppState({ status: 'role-selection' });
    }
  };

  const handleRoleSelect = async (role: Role) => {
    if (!role) return;
    
    try {
      log.info(`Role selected: ${role}`);
      setAppState({ status: 'initializing-node', role });
      
      // Initialize the peer node
      const api = await initApi(role);
      const nodeInfo = api.getNodeInfo();
      
      if (!nodeInfo) {
        throw new Error('Failed to get node info');
      }
      
      log.info(`Node initialized with ID: ${nodeInfo.nodeId}`);
      
      // Save the node state
      const nodeState: NodeState = {
        role: nodeInfo.role,
        secretKey: nodeInfo.secretKey,
        nodeId: nodeInfo.nodeId,
        createdAt: new Date().toISOString()
      };
      
      await storage.saveNodeState(nodeState);
      
      setAppState({
        status: 'ready',
        role,
        nodeState
      });
    } catch (error) {
      log.error('Failed to initialize node', error);
      // Go back to role selection on error
      setAppState({ status: 'role-selection' });
    }
  };

  const handleBackToRoleSelection = async () => {
    try {
      log.info('Returning to role selection');
      
      // Clear the saved state
      await storage.clearNodeState();
      
      // Reset the API
      resetApi();
      
      // Go back to role selection
      setAppState({ status: 'role-selection' });
    } catch (error) {
      log.error('Error during reset', error);
    }
  };

  // Render based on app state
  switch (appState.status) {
    case 'loading':
      return <LoadingScreen message="Loading application..." />;
    
    case 'initializing-node':
      return <LoadingScreen message={`Initializing ${appState.role} node...`} />;
    
    case 'role-selection':
      return <RoleSelection onRoleSelect={handleRoleSelect} />;
    
    case 'ready':
      return (
        <>
          {appState.role === 'employee' && (
            <EmployeeView onBack={handleBackToRoleSelection} />
          )}
          {appState.role === 'issuer' && (
            <IssuerView onBack={handleBackToRoleSelection} />
          )}
          {appState.role === 'verifier' && (
            <VerifierView onBack={handleBackToRoleSelection} />
          )}
        </>
      );
    
    default:
      return <LoadingScreen message="Initializing..." />;
  }
}

export default App;
