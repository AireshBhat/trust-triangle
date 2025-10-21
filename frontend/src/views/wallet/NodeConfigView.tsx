import { useState, useEffect } from 'react';
import { Link, Info, Save, Loader2 } from 'lucide-react';
import { employeeStorage, type EmployeeConfig } from '../../lib/storage/employeeStorage';
import { log } from '../../lib/log';

interface NodeConfigViewProps {
  onConfigComplete: (config: EmployeeConfig) => void;
}

export default function NodeConfigView({ onConfigComplete }: NodeConfigViewProps) {
  const [issuerNodeId, setIssuerNodeId] = useState('');
  const [verifierNodeId, setVerifierNodeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    try {
      const config = await employeeStorage.loadEmployeeConfig();
      if (config) {
        setIssuerNodeId(config.issuerNodeId);
        setVerifierNodeId(config.verifierNodeId);
      }
    } catch (err) {
      log.error('Failed to load employee config', err);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!issuerNodeId.trim()) {
      setError('Please enter an Issuer Node ID');
      return;
    }
    if (!verifierNodeId.trim()) {
      setError('Please enter a Verifier Node ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = {
        issuerNodeId: issuerNodeId.trim(),
        verifierNodeId: verifierNodeId.trim(),
      };

      await employeeStorage.saveEmployeeConfig(config);
      log.info('Employee configuration saved successfully');

      // Call completion handler
      onConfigComplete({
        ...config,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      log.error('Failed to save employee config', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = issuerNodeId.trim() && verifierNodeId.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Employee Wallet Setup
        </h2>
        <p className="text-slate-400">
          Connect to your payroll provider and verification service
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">What are Node IDs?</p>
            <p className="text-blue-300">
              Node IDs are unique identifiers for peers in the P2P network. 
              You'll need the Node ID from your payroll provider (Issuer) and 
              the verification service (Verifier) to request and present credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Issuer Node ID Section */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Link className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Issuer Node ID</h3>
            <p className="text-sm text-slate-400">Your payroll provider or employer</p>
          </div>
        </div>

        <input
          type="text"
          value={issuerNodeId}
          onChange={(e) => {
            setIssuerNodeId(e.target.value);
            setError(null);
          }}
          placeholder="Enter issuer node ID (e.g., node1a2b3c4d5e6...)"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono text-sm"
        />
        
        {issuerNodeId && (
          <p className="mt-2 text-xs text-slate-500">
            Length: {issuerNodeId.length} characters
          </p>
        )}
      </div>

      {/* Verifier Node ID Section */}
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Link className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Verifier Node ID</h3>
            <p className="text-sm text-slate-400">Verification service or employer</p>
          </div>
        </div>

        <input
          type="text"
          value={verifierNodeId}
          onChange={(e) => {
            setVerifierNodeId(e.target.value);
            setError(null);
          }}
          placeholder="Enter verifier node ID (e.g., node7f8g9h0i1j2...)"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm"
        />
        
        {verifierNodeId && (
          <p className="mt-2 text-xs text-slate-500">
            Length: {verifierNodeId.length} characters
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!isValid || loading}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving Configuration...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Configuration
          </>
        )}
      </button>

      {/* Helper Text */}
      <p className="text-center text-sm text-slate-500">
        You can update these settings later from the wallet settings
      </p>
    </div>
  );
}

