import { useState, useEffect } from 'react';
import { ArrowLeft, UserCircle, Plus, Settings, Loader2 } from 'lucide-react';
import { employeeStorage, type EmployeeConfig } from '../lib/storage/employeeStorage';
import { initApi } from '../lib';
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

  // Load employee configuration and node ID on mount
  useEffect(() => {
    loadEmployeeState();
    loadNodeId();
  }, []);

  const loadNodeId = async () => {
    try {
      const api = await initApi('employee');
      const info = api.getNodeInfo();
      if (info) {
        setNodeId(info.nodeId);
      }
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
              {/* Credentials List (Empty state for now) */}
              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
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
                  <button
                    onClick={handleGenerateStatement}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Generate Income Statement
                  </button>
                </div>
              </div>

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

          {viewState.type === 'generate' && (
            <IncomeCredentialView
              employeeConfig={viewState.config}
              onBack={handleBackToList}
              onRequestSent={handleBackToList}
            />
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
