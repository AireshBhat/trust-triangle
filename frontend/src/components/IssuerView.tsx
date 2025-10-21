import { useState, useEffect } from 'react';
import { ArrowLeft, FileCheck, Clock, CheckCircle, XCircle, Loader2, DollarSign, Calendar, User, RefreshCw } from 'lucide-react';
import { initApi, formatSalary, formatPaymentMode, formatPayPeriod, type API, type PendingCredentialRequest } from '../lib';
import NodeIdDisplay from './NodeIdDisplay';
import { log } from '../lib/log';

interface IssuerViewProps {
  onBack: () => void;
}

export default function IssuerView({ onBack }: IssuerViewProps) {
  const [nodeId, setNodeId] = useState<string>('');
  const [api, setApi] = useState<API | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingCredentialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load node ID and API on mount
  useEffect(() => {
    loadIssuerNode();
  }, []);

  // Poll for pending requests every 5 seconds
  useEffect(() => {
    if (!api) return;

    const loadRequests = async () => {
      try {
        const requests = await api.getPendingRequests();
        setPendingRequests(requests);
        setLoading(false);
      } catch (err) {
        log.error('Failed to load pending requests', err);
        setError(err instanceof Error ? err.message : 'Failed to load requests');
        setLoading(false);
      }
    };

    loadRequests();
    const interval = setInterval(loadRequests, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [api]);

  const loadIssuerNode = async () => {
    try {
      const apiInstance = await initApi('issuer');
      setApi(apiInstance);
      const info = apiInstance.getNodeInfo();
      if (info) {
        setNodeId(info.nodeId);
      }
    } catch (error) {
      log.error('Failed to initialize issuer node', error);
      setError('Failed to initialize node');
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!api) return;
    
    setProcessingId(requestId);
    setError(null);
    
    try {
      log.info(`Approving request ${requestId}`);
      await api.approveRequest(requestId);
      log.info('✅ Request approved and credential sent');
      
      // Refresh the list
      const updatedRequests = await api.getPendingRequests();
      setPendingRequests(updatedRequests);
    } catch (err) {
      log.error('Failed to approve request', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!api) return;
    
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    setProcessingId(requestId);
    setError(null);
    
    try {
      log.info(`Rejecting request ${requestId}`);
      await api.rejectRequest(requestId, reason || undefined);
      log.info('✅ Request rejected');
      
      // Refresh the list
      const updatedRequests = await api.getPendingRequests();
      setPendingRequests(updatedRequests);
    } catch (err) {
      log.error('Failed to reject request', err);
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefresh = async () => {
    if (!api) return;
    
    setLoading(true);
    try {
      const requests = await api.getPendingRequests();
      setPendingRequests(requests);
    } catch (err) {
      log.error('Failed to refresh requests', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  };

  const getPendingOnly = () => {
    return pendingRequests.filter(req => req.status === 'pending');
  };

  const pendingOnly = getPendingOnly();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
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
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Issuer Dashboard</h1>
                <p className="text-slate-400">Review and approve credential requests</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Node ID Display */}
          {nodeId && (
            <div className="mb-8">
              <NodeIdDisplay 
                nodeId={nodeId} 
                label="Your Issuer Node ID (DID)" 
                variant="issuer" 
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700/50 rounded-xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{pendingOnly.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-slate-400 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-white">
                    {pendingRequests.filter(r => r.status === 'approved').length}
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
                    {pendingRequests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Requests List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Pending Requests</h2>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="ml-3 text-slate-400">Loading requests...</span>
              </div>
            )}

            {!loading && pendingOnly.length === 0 && (
              <div className="bg-slate-900/50 rounded-xl p-12 border border-slate-700 text-center">
                <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Pending Requests</h3>
                <p className="text-slate-400">Waiting for employees to request credentials...</p>
              </div>
            )}

            {!loading && pendingOnly.map((request) => (
              <div
                key={request.requestId}
                className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-white">{request.employeeName}</h3>
                    </div>
                    <p className="text-sm text-slate-400 font-mono">
                      Employee: {request.employeeNodeId.substring(0, 24)}...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/20 border border-amber-700/30 rounded-full">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-300 font-medium uppercase">Pending</span>
                  </div>
                </div>

                {/* Salary Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Gross Salary</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <p className="text-white font-semibold">
                        {formatSalary(request.grossSalary, request.currency)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Net Salary</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <p className="text-white font-semibold">
                        {formatSalary(request.netSalary, request.currency)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Pay Period</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <p className="text-white font-semibold">
                        {formatPayPeriod(request.payPeriod)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Payment Mode</p>
                    <p className="text-white font-semibold">
                      {formatPaymentMode(request.paymentMode)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => handleApprove(request.requestId)}
                    disabled={processingId === request.requestId}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingId === request.requestId ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve & Sign
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(request.requestId)}
                    disabled={processingId === request.requestId}
                    className="flex-1 bg-red-900/50 hover:bg-red-900/70 text-red-300 font-semibold py-2.5 rounded-lg border border-red-700/50 hover:border-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
