import { useState, useEffect } from 'react';
import { ArrowLeft, UserCircle, Plus, Settings, Loader2, CheckCircle, XCircle, FileCheck, DollarSign, Calendar, RefreshCw, Send } from 'lucide-react';
import { employeeStorage, type EmployeeConfig } from '../lib/storage/employeeStorage';
import { initApi, formatSalary, formatPaymentMode, formatPayPeriod, createPresentCredential, generateRequestId, type API, type ReceivedCredentialResponse, type AcceptEvent } from '../lib';
import NodeConfigView from '../views/wallet/NodeConfigView';
import IncomeCredentialView from '../views/wallet/IncomeCredentialView';
import NodeIdDisplay from './NodeIdDisplay';
import { log } from '../lib/log';

interface EmployeeViewProps {
  onBack: () => void;
}

type ViewState = 
  | { type: 'loading' }
  | { type: 'config' }
  | { type: 'list'; config: EmployeeConfig }
  | { type: 'generate'; config: EmployeeConfig }
  | { type: 'settings'; config: EmployeeConfig };

export default function EmployeeView({ onBack }: EmployeeViewProps) {
  const [viewState, setViewState] = useState<ViewState>({ type: 'loading' });
  const [nodeId, setNodeId] = useState<string>('');
  const [api, setApi] = useState<API | null>(null);
  const [credentials, setCredentials] = useState<ReceivedCredentialResponse[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presentingCredential, setPresentingCredential] = useState<string | null>(null); // requestId being presented

  // Load employee configuration and node ID on mount
  useEffect(() => {
    loadEmployeeState();
    loadNodeId();
  }, []);

  // Poll for credentials every 5 seconds when API is ready
  useEffect(() => {
    if (!api) return;

    const loadCredentials = async () => {
      try {
        setLoadingCredentials(true);
        const receivedCreds = await api.getReceivedCredentials();
        setCredentials(receivedCreds);
        setError(null);
      } catch (err) {
        log.error('Failed to load credentials', err);
        setError(err instanceof Error ? err.message : 'Failed to load credentials');
      } finally {
        setLoadingCredentials(false);
      }
    };

    loadCredentials();
    const interval = setInterval(loadCredentials, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [api]);

  const loadNodeId = async () => {
    try {
      const apiInstance = await initApi('employee');
      setApi(apiInstance);
      const info = apiInstance.getNodeInfo();
      if (info) {
        setNodeId(info.nodeId);
      }

      // Subscribe to accept events to listen for verification results
      apiInstance.subscribeToAcceptEvents((event: AcceptEvent) => {
        if (event.type === 'messageReceived' && event.message.type === 'verificationResult') {
          const result = event.message;
          log.info(`Received verification result: ${JSON.stringify(result)}`);

          // Clear presenting state
          setPresentingCredential(null);

          // Show notification
          const status = result.isValid && result.isTrusted ? '✅ Verified' : 
                        result.isValid ? '⚠️ Valid but untrusted' : '❌ Invalid';
          alert(`${status}\n\n${result.message}`);
        }
      });
    } catch (error) {
      log.error('Failed to get node ID', error);
    }
  };

  const loadEmployeeState = async () => {
    try {
      const config = await employeeStorage.loadEmployeeConfig();
      
      if (config && config.issuerNodeId && config.verifierNodeId) {
        log.info('Employee configuration found');
        setViewState({ type: 'list', config });
      } else {
        log.info('No employee configuration found, showing setup');
        setViewState({ type: 'config' });
      }
    } catch (error) {
      log.error('Failed to load employee state', error);
      setViewState({ type: 'config' });
    }
  };

  const handleConfigComplete = (config: EmployeeConfig) => {
    log.info('Configuration completed');
    setViewState({ type: 'list', config });
  };

  const handleGenerateStatement = () => {
    if (viewState.type === 'list') {
      setViewState({ type: 'generate', config: viewState.config });
    }
  };

  const handleBackToList = () => {
    if (viewState.type !== 'list' && viewState.type !== 'loading' && viewState.type !== 'config') {
      setViewState({ type: 'list', config: viewState.config });
    }
  };

  const handleOpenSettings = () => {
    if (viewState.type === 'list') {
      setViewState({ type: 'settings', config: viewState.config });
    }
  };

  const handleRefreshCredentials = async () => {
    if (!api) return;
    
    setLoadingCredentials(true);
    try {
      const receivedCreds = await api.getReceivedCredentials();
      console.log({ receivedCreds })
      setCredentials(receivedCreds);
      setError(null);
    } catch (err) {
      log.error('Failed to refresh credentials', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handlePresentToVerifier = async (cred: ReceivedCredentialResponse) => {
    if (!api || !cred.credential) {
      alert('No valid credential to present');
      return;
    }

    // Get verifier Node ID from config or prompt
    let verifierNodeId: string | null = null;
    
    if (viewState.type === 'list' && viewState.config.verifierNodeId) {
      verifierNodeId = viewState.config.verifierNodeId;
    } else {
      verifierNodeId = prompt('Enter Verifier Node ID:');
    }

    if (!verifierNodeId || !verifierNodeId.trim()) {
      alert('Verifier Node ID is required');
      return;
    }

    try {
      setPresentingCredential(cred.requestId);
      
      // Generate a unique presentation ID
      const presentationId = generateRequestId();
      
      // Create the presentation message
      const payload = createPresentCredential({
        presentationId,
        credential: cred.credential,
      });

      log.info(`Presenting credential to verifier ${JSON.stringify({ presentationId, verifierNodeId })}`);

      // Send to verifier
      await api.connect(verifierNodeId.trim(), payload);
      
      // Store the presentation ID mapping for tracking
      localStorage.setItem(`presentation_${presentationId}`, cred.requestId);
      
      alert(`Credential sent to verifier!\n\nPresentation ID: ${presentationId}\n\nWaiting for verification result...`);
    } catch (err) {
      log.error('Failed to present credential', err);
      alert(`Failed to present credential: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPresentingCredential(null);
    }
  };

  const handleReconfigure = () => {
    setViewState({ type: 'config' });
  };

  // Render based on view state
  if (viewState.type === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading employee wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Role Selection
          </button>

          {viewState.type === 'list' && (
            <button
              onClick={handleOpenSettings}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          {/* Title Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Employee Wallet</h1>
              <p className="text-slate-400">Manage your income credentials</p>
            </div>
          </div>

          {/* Node ID Display */}
          {nodeId && (
            <div className="mb-8">
              <NodeIdDisplay 
                nodeId={nodeId} 
                label="Your Node ID (DID)" 
                variant="employee" 
              />
            </div>
          )}

          {/* Content based on view state */}
          {viewState.type === 'config' && (
            <NodeConfigView onConfigComplete={handleConfigComplete} />
          )}

          {viewState.type === 'list' && (
            <div className="space-y-6">
              {/* Header with Refresh Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">My Credentials</h2>
                  <p className="text-sm text-slate-400">View your income credentials</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRefreshCredentials}
                    disabled={loadingCredentials}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingCredentials ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={handleGenerateStatement}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Request New
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Total</p>
                      <p className="text-2xl font-bold text-white">{credentials.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Approved</p>
                      <p className="text-2xl font-bold text-white">
                        {credentials.filter(c => c.credential).length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Rejected</p>
                      <p className="text-2xl font-bold text-white">
                        {credentials.filter(c => !c.credential && c.error).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credentials List */}
              {loadingCredentials && credentials.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-slate-400">Loading credentials...</span>
                </div>
              )}

              {!loadingCredentials && credentials.length === 0 && (
                <div className="bg-slate-900/50 rounded-xl p-12 border border-slate-700 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserCircle className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Credentials Yet
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Request your first income statement credential from your payroll provider
                    </p>
                  </div>
                </div>
              )}

              {/* Credential Cards */}
              {credentials.length > 0 && (
                <div className="space-y-4">
                  {credentials.map((cred) => (
                    <div
                      key={cred.requestId}
                      className={`bg-slate-900/50 rounded-xl p-6 border transition-colors ${
                        cred.credential 
                          ? 'border-green-700/50 hover:border-green-500/50' 
                          : 'border-red-700/50 hover:border-red-500/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {cred.credential ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                            <h3 className="text-lg font-semibold text-white">
                              {cred.credential 
                                ? `Income Credential - ${cred.credential.credential.employeeName}`
                                : 'Request Rejected'
                              }
                            </h3>
                          </div>
                          <p className="text-sm text-slate-400 font-mono">
                            Issuer: {cred.issuerNodeId.substring(0, 24)}...
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Received: {new Date(cred.receivedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                          cred.credential 
                            ? 'bg-green-900/20 border border-green-700/30'
                            : 'bg-red-900/20 border border-red-700/30'
                        }`}>
                          {cred.credential ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-300 font-medium uppercase">Approved</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-red-300 font-medium uppercase">Rejected</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Credential Details (if approved) */}
                      {cred.credential && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Gross Salary</p>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <p className="text-white font-semibold">
                                {formatSalary(cred.credential?.credential?.grossSalary, cred.credential?.credential?.currency)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Net Salary</p>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-400" />
                              <p className="text-white font-semibold">
                                {formatSalary(cred.credential?.credential?.netSalary, cred.credential?.credential?.currency)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Pay Period</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <p className="text-white font-semibold">
                                {formatPayPeriod(cred.credential?.credential?.payPeriod)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Payment Mode</p>
                            <p className="text-white font-semibold">
                              {formatPaymentMode(cred.credential?.credential?.paymentMode)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Error Message (if rejected) */}
                      {!cred.credential && cred.error && (
                        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-4">
                          <p className="text-sm text-red-300">
                            <span className="font-semibold">Reason: </span>
                            {cred.error}
                          </p>
                        </div>
                      )}

                      {/* Action Button (if approved) */}
                      {cred.credential && (
                        <div className="pt-4 border-t border-slate-700">
                          <button
                            onClick={() => handlePresentToVerifier(cred)}
                            disabled={presentingCredential === cred.requestId}
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {presentingCredential === cred.requestId ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Present to Verifier
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Connected Services Info */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Connected Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3">
                    <p className="text-slate-400 mb-1">Issuer (Payroll Provider)</p>
                    <p className="text-white font-mono text-xs break-all">
                      {viewState.config.issuerNodeId}
                    </p>
                  </div>
                  <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                    <p className="text-slate-400 mb-1">Verifier</p>
                    <p className="text-white font-mono text-xs break-all">
                      {viewState.config.verifierNodeId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewState.type === 'generate' && api && (
            <IncomeCredentialView
              api={api}
              employeeConfig={viewState.config}
              onBack={handleBackToList}
              onRequestSent={handleBackToList}
            />
          )}
          
          {viewState.type === 'generate' && !api && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-slate-400">Initializing peer connection...</span>
            </div>
          )}

          {viewState.type === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-4">Wallet Settings</h2>
              
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Connected Services</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Issuer Node ID
                    </label>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm text-slate-300 break-all">
                      {viewState.config.issuerNodeId}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Verifier Node ID
                    </label>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm text-slate-300 break-all">
                      {viewState.config.verifierNodeId}
                    </div>
                  </div>

                  <button
                    onClick={handleReconfigure}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Reconfigure Node IDs
                  </button>
                </div>
              </div>

              <button
                onClick={handleBackToList}
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all"
              >
                Back to Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
