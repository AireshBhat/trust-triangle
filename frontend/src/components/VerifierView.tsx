import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Plus, Trash2, RefreshCw, UserCheck, AlertTriangle, CheckCircle, XCircle, Clock, List } from 'lucide-react';
import { initApi, formatSalary, formatPaymentMode, formatPayPeriod, type API, type VerifiedCredentialRecord } from '../lib';
import NodeIdDisplay from './NodeIdDisplay';
import { log } from '../lib/log';

interface VerifierViewProps {
  onBack: () => void;
}

type ViewMode = 'manage' | 'history';

export default function VerifierView({ onBack }: VerifierViewProps) {
  const [nodeId, setNodeId] = useState<string>('');
  const [api, setApi] = useState<API | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('manage');
  
  // Trusted issuers state
  const [trustedIssuers, setTrustedIssuers] = useState<string[]>([]);
  const [loadingIssuers, setLoadingIssuers] = useState(false);
  const [newIssuerNodeId, setNewIssuerNodeId] = useState('');
  const [addingIssuer, setAddingIssuer] = useState(false);
  const [removingIssuer, setRemovingIssuer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verified credentials state
  const [verifiedCredentials, setVerifiedCredentials] = useState<VerifiedCredentialRecord[]>([]);
  const [loadingVerified, setLoadingVerified] = useState(false);

  // Load node ID and API on mount
  useEffect(() => {
    loadNodeId();
  }, []);

  // Poll for trusted issuers every 5 seconds
  useEffect(() => {
    if (!api) return;

    const fetchTrustedIssuers = async () => {
      try {
        setLoadingIssuers(true);
        const issuers = await api.getTrustedIssuers();
        setTrustedIssuers(issuers);
        setError(null);
      } catch (err) {
        log.error('Failed to fetch trusted issuers', err);
        setError('Failed to load trusted issuers');
      } finally {
        setLoadingIssuers(false);
      }
    };

    fetchTrustedIssuers();
    const interval = setInterval(fetchTrustedIssuers, 5000);

    return () => clearInterval(interval);
  }, [api]);

  // Poll for verified credentials every 5 seconds
  useEffect(() => {
    if (!api) return;

    const fetchVerifiedCredentials = async () => {
      try {
        setLoadingVerified(true);
        const verified = await api.getVerifiedCredentials();
        setVerifiedCredentials(verified);
        setError(null);
      } catch (err) {
        log.error('Failed to fetch verified credentials', err);
        // Don't set error here as it would interfere with issuer management
      } finally {
        setLoadingVerified(false);
      }
    };

    fetchVerifiedCredentials();
    const interval = setInterval(fetchVerifiedCredentials, 5000);

    return () => clearInterval(interval);
  }, [api]);

  const loadNodeId = async () => {
    try {
      const apiInstance = await initApi('verifier');
      const info = apiInstance.getNodeInfo();
      if (info) {
        setNodeId(info.nodeId);
        setApi(apiInstance);
      }
    } catch (error) {
      log.error('Failed to get node ID', error);
      setError('Failed to initialize verifier');
    }
  };

  const handleAddIssuer = async () => {
    if (!api || !newIssuerNodeId.trim()) {
      setError('Please enter a valid issuer Node ID');
      return;
    }

    try {
      setAddingIssuer(true);
      setError(null);
      await api.addTrustedIssuer(newIssuerNodeId.trim());
      
      // Refresh the list
      const updatedIssuers = await api.getTrustedIssuers();
      setTrustedIssuers(updatedIssuers);
      
      setNewIssuerNodeId('');
      log.info('Successfully added trusted issuer');
    } catch (err) {
      log.error('Failed to add trusted issuer', err);
      setError('Failed to add trusted issuer. Please check the Node ID format.');
    } finally {
      setAddingIssuer(false);
    }
  };

  const handleRemoveIssuer = async (issuerNodeId: string) => {
    if (!api) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove this trusted issuer?\n\n${issuerNodeId.substring(0, 20)}...`
    );

    if (!confirmed) return;

    try {
      setRemovingIssuer(issuerNodeId);
      setError(null);
      await api.removeTrustedIssuer(issuerNodeId);
      
      // Refresh the list
      const updatedIssuers = await api.getTrustedIssuers();
      setTrustedIssuers(updatedIssuers);
      
      log.info('Successfully removed trusted issuer');
    } catch (err) {
      log.error('Failed to remove trusted issuer', err);
      setError('Failed to remove trusted issuer');
    } finally {
      setRemovingIssuer(null);
    }
  };

  const handleRefreshIssuers = async () => {
    if (!api) return;

    try {
      setLoadingIssuers(true);
      setError(null);
      const issuers = await api.getTrustedIssuers();
      setTrustedIssuers(issuers);
    } catch (err) {
      log.error('Failed to refresh trusted issuers', err);
      setError('Failed to refresh trusted issuers');
    } finally {
      setLoadingIssuers(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Role Selection
        </button>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Verifier Dashboard</h1>
                <p className="text-slate-400">Manage trusted issuers and verify credentials</p>
              </div>
            </div>
            <button
              onClick={handleRefreshIssuers}
              disabled={loadingIssuers}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh trusted issuers"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loadingIssuers ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Node ID Display */}
          {nodeId && (
            <div className="mb-6">
              <NodeIdDisplay 
                nodeId={nodeId} 
                label="Your Verifier Node ID (Public Key)" 
                variant="verifier" 
              />
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            <button
              onClick={() => setViewMode('manage')}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                viewMode === 'manage'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Manage Issuers
              {trustedIssuers.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                  {trustedIssuers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                viewMode === 'history'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              Verification History
              {verifiedCredentials.length > 0 && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                  {verifiedCredentials.length}
                </span>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* Manage Issuers View */}
          {viewMode === 'manage' && (
            <>
              {/* Statistics */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Trusted Issuers</p>
                  <p className="text-3xl font-bold text-white mt-1">{trustedIssuers.length}</p>
                </div>
                <UserCheck className="w-12 h-12 text-amber-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Add Trusted Issuer Form */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Trusted Issuer
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Add an issuer's Node ID (Public Key) to your trusted list. You can only verify credentials signed by trusted issuers.
            </p>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={newIssuerNodeId}
                onChange={(e) => setNewIssuerNodeId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIssuer()}
                placeholder="Enter Issuer Node ID (e.g., abc123def456...)"
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={addingIssuer}
              />
              <button
                onClick={handleAddIssuer}
                disabled={addingIssuer || !newIssuerNodeId.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addingIssuer ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Issuer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Trusted Issuers List */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              Trusted Issuers ({trustedIssuers.length})
            </h3>

            {loadingIssuers && trustedIssuers.length === 0 ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
                <p className="text-slate-400">Loading trusted issuers...</p>
              </div>
            ) : trustedIssuers.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No trusted issuers yet</p>
                <p className="text-slate-500 text-sm">
                  Add issuer Node IDs above to start verifying credentials
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trustedIssuers.map((issuerNodeId) => (
                  <div
                    key={issuerNodeId}
                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-amber-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-green-400 text-sm font-medium">Trusted Issuer</span>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                          <p className="text-xs text-slate-500 mb-1">Node ID (Public Key)</p>
                          <p className="text-white font-mono text-sm break-all">{issuerNodeId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveIssuer(issuerNodeId)}
                        disabled={removingIssuer === issuerNodeId}
                        className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Remove trusted issuer"
                      >
                        {removingIssuer === issuerNodeId ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">How Verification Works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                  <li>Employees present credentials signed by issuers</li>
                  <li>You can only verify credentials from trusted issuers</li>
                  <li>Each credential is cryptographically signed using the issuer's private key</li>
                  <li>The signature is verified using the issuer's public key (Node ID)</li>
                </ul>
              </div>
            </div>
          </div>
            </>
          )}

          {/* Verification History View */}
          {viewMode === 'history' && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-slate-400 text-sm">Total Verified</p>
                  <p className="text-3xl font-bold text-white mt-1">{verifiedCredentials.length}</p>
                </div>
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/50">
                  <p className="text-green-400 text-sm">Valid & Trusted</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">
                    {verifiedCredentials.filter(c => c.isValid && c.isTrusted).length}
                  </p>
                </div>
                <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-700/50">
                  <p className="text-yellow-400 text-sm">Valid (Untrusted)</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-1">
                    {verifiedCredentials.filter(c => c.isValid && !c.isTrusted).length}
                  </p>
                </div>
              </div>

              {/* Verified Credentials List */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Verification History</h3>

                {loadingVerified && verifiedCredentials.length === 0 ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
                    <p className="text-slate-400">Loading verification history...</p>
                  </div>
                ) : verifiedCredentials.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">No verifications yet</p>
                    <p className="text-slate-500 text-sm">
                      Credentials will appear here when employees present them for verification
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifiedCredentials.sort((a, b) => 
                      new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
                    ).map((record) => {
                      const status = record.isValid && record.isTrusted ? 'verified' : 
                                    record.isValid ? 'untrusted' : 'invalid';
                      return (
                        <div
                          key={record.presentationId}
                          className={`bg-slate-800/50 rounded-lg p-5 border transition-colors ${
                            status === 'verified' 
                              ? 'border-green-700/50 hover:border-green-500/50' 
                              : status === 'untrusted'
                              ? 'border-yellow-700/50 hover:border-yellow-500/50'
                              : 'border-red-700/50 hover:border-red-500/50'
                          }`}
                        >
                          {/* Status Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              {status === 'verified' ? (
                                <>
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                  <span className="text-green-400 font-semibold">✓ Verified & Trusted</span>
                                </>
                              ) : status === 'untrusted' ? (
                                <>
                                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                  <span className="text-yellow-400 font-semibold">⚠ Valid but Untrusted Issuer</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-5 h-5 text-red-400" />
                                  <span className="text-red-400 font-semibold">✗ Invalid Signature</span>
                                </>
                              )}
                            </div>
                            <span className="text-slate-500 text-sm">
                              {new Date(record.verifiedAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Credential Details */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Employee</p>
                              <p className="text-white font-medium">{record.credential.credential.employeeName}</p>
                              <p className="text-slate-400 text-xs font-mono mt-0.5">
                                {record.employeeNodeId.substring(0, 16)}...
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Issuer</p>
                              <p className="text-white font-medium">{record.credential.credential.employerName}</p>
                              <p className="text-slate-400 text-xs font-mono mt-0.5">
                                {record.issuerNodeId.substring(0, 16)}...
                              </p>
                            </div>
                          </div>

                          {/* Salary Information */}
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 mb-3">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500 mb-1">Gross Salary</p>
                                <p className="text-white font-semibold">
                                  {formatSalary(
                                    record.credential.credential.grossSalary, 
                                    record.credential.credential.currency
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Net Salary</p>
                                <p className="text-white font-semibold">
                                  {formatSalary(
                                    record.credential.credential.netSalary, 
                                    record.credential.credential.currency
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Pay Period</p>
                                <p className="text-white font-semibold">
                                  {formatPayPeriod(record.credential.credential.payPeriod)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700 text-sm">
                              <p className="text-slate-500">Payment Mode:</p>
                              <p className="text-white">
                                {formatPaymentMode(record.credential.credential.paymentMode)}
                              </p>
                            </div>
                          </div>

                          {/* Presentation ID */}
                          <div className="text-xs text-slate-500">
                            <span>Presentation ID: </span>
                            <span className="font-mono">{record.presentationId}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
