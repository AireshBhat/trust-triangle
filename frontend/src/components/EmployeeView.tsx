import { useState } from 'react';
import { ArrowLeft, UserCircle, Link, Send, Clock, CheckCircle } from 'lucide-react';

interface EmployeeViewProps {
  onBack: () => void;
}

type EmployeeStep = 'idle' | 'adding-issuer' | 'adding-verifier' | 'waiting-statement' | 'statement-received' | 'sending-to-verifier';

export default function EmployeeView({ onBack }: EmployeeViewProps) {
  const [step, setStep] = useState<EmployeeStep>('idle');
  const [issuerNodeId, setIssuerNodeId] = useState('');
  const [verifierNodeId, setVerifierNodeId] = useState('');
  const [statementData, setStatementData] = useState<any>(null);

  const handleAddIssuer = () => {
    if (issuerNodeId.trim()) {
      setStep('adding-verifier');
    }
  };

  const handleAddVerifier = () => {
    if (verifierNodeId.trim()) {
      setStep('waiting-statement');
    }
  };

  const handleSendToVerifier = () => {
    setStep('sending-to-verifier');
  };

  const mockStatement = {
    employer: 'TechCorp Inc.',
    employee: 'John Doe',
    grossSalary: '$120,000',
    netSalary: '$95,000',
    currency: 'USD',
    payPeriod: 'Annual',
    issuedAt: new Date().toISOString(),
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
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Employee Dashboard</h1>
              <p className="text-slate-400">Request and manage your credentials</p>
            </div>
          </div>

          {step === 'idle' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <Link className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Add Issuer Node ID</h3>
                </div>
                <p className="text-slate-400 mb-4">Connect to the issuer to request credentials</p>
                <input
                  type="text"
                  value={issuerNodeId}
                  onChange={(e) => setIssuerNodeId(e.target.value)}
                  placeholder="Enter issuer node ID..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors mb-4"
                />
                <button
                  onClick={handleAddIssuer}
                  disabled={!issuerNodeId.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect to Issuer
                </button>
              </div>
            </div>
          )}

          {step === 'adding-verifier' && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300">Connected to Issuer: {issuerNodeId}</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <Link className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-white">Add Verifier Node ID</h3>
                </div>
                <p className="text-slate-400 mb-4">Connect to the verifier who will validate your credentials</p>
                <input
                  type="text"
                  value={verifierNodeId}
                  onChange={(e) => setVerifierNodeId(e.target.value)}
                  placeholder="Enter verifier node ID..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors mb-4"
                />
                <button
                  onClick={handleAddVerifier}
                  disabled={!verifierNodeId.trim()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect to Verifier
                </button>
              </div>
            </div>
          )}

          {step === 'waiting-statement' && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300">Connected to Issuer & Verifier</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
                <Clock className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-white mb-2">Waiting for Statement</h3>
                <p className="text-slate-400">The issuer will send you a credential statement</p>
                <button
                  onClick={() => {
                    setStatementData(mockStatement);
                    setStep('statement-received');
                  }}
                  className="mt-6 text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Simulate receiving statement
                </button>
              </div>
            </div>
          )}

          {step === 'statement-received' && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300">Statement Received</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Credential Statement</h3>
                <div className="space-y-3">
                  {Object.entries(statementData).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-white font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSendToVerifier}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Statement to Verifier
              </button>
            </div>
          )}

          {step === 'sending-to-verifier' && (
            <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Statement Sent</h3>
              <p className="text-slate-400">Your credential has been sent to the verifier for validation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
