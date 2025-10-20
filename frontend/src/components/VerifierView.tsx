import { useState } from 'react';
import { ArrowLeft, Shield, Clock, CheckCircle, AlertCircle, FileText, Send } from 'lucide-react';

interface VerifierViewProps {
  onBack: () => void;
}

type VerifierStep = 'waiting-connection' | 'employee-connected' | 'statement-received' | 'verifying' | 'verification-complete';

interface ReceivedStatement {
  employerName: string;
  employeeName: string;
  grossSalary: string;
  netSalary: string;
  currency: string;
  payPeriod: string;
  signature: string;
  issuedAt: string;
}

export default function VerifierView({ onBack }: VerifierViewProps) {
  const [step, setStep] = useState<VerifierStep>('waiting-connection');
  const [employeeNodeId, setEmployeeNodeId] = useState('');
  const [statement, setStatement] = useState<ReceivedStatement | null>(null);
  const [verificationResult, setVerificationResult] = useState<'valid' | 'invalid' | null>(null);

  const handleEmployeeConnect = () => {
    setEmployeeNodeId('employee-' + Math.random().toString(36).substring(7));
    setStep('employee-connected');
  };

  const handleReceiveStatement = () => {
    const mockStatement: ReceivedStatement = {
      employerName: 'TechCorp Inc.',
      employeeName: 'John Doe',
      grossSalary: '$120,000',
      netSalary: '$95,000',
      currency: 'USD',
      payPeriod: 'Annual',
      signature: 'sig_' + Math.random().toString(36).substring(7),
      issuedAt: new Date().toISOString(),
    };
    setStatement(mockStatement);
    setStep('statement-received');
  };

  const handleRequestVerification = () => {
    setStep('verifying');
    setTimeout(() => {
      setVerificationResult('valid');
      setStep('verification-complete');
    }, 2000);
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
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/50">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Verifier Dashboard</h1>
              <p className="text-slate-400">Verify and validate employee credentials</p>
            </div>
          </div>

          {step === 'waiting-connection' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
                <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-white mb-2">Waiting for Employee Connection</h3>
                <p className="text-slate-400 mb-6">Ready to receive and verify credentials</p>

                <div className="bg-slate-800 rounded-lg p-4 mb-6">
                  <p className="text-slate-500 text-sm mb-2">Your Node ID:</p>
                  <p className="text-amber-400 font-mono text-lg">verifier-{Math.random().toString(36).substring(7)}</p>
                </div>

                <button
                  onClick={handleEmployeeConnect}
                  className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Simulate employee connection
                </button>
              </div>
            </div>
          )}

          {step === 'employee-connected' && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300">Employee Connected: {employeeNodeId}</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
                <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-white mb-2">Waiting for Statement</h3>
                <p className="text-slate-400 mb-6">Employee will send their credential for verification</p>

                <button
                  onClick={handleReceiveStatement}
                  className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Simulate receiving statement
                </button>
              </div>
            </div>
          )}

          {step === 'statement-received' && statement && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300">Statement Received from Employee</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-semibold text-white mb-4">Credential Statement</h3>
                <div className="space-y-3">
                  {Object.entries(statement).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-white font-medium break-all text-right ml-4">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRequestVerification}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Request Verification from Issuer
              </button>
            </div>
          )}

          {step === 'verifying' && (
            <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Verifying Credential</h3>
              <p className="text-slate-400">Validating signature and credential data with issuer...</p>
            </div>
          )}

          {step === 'verification-complete' && statement && (
            <div className="space-y-6">
              {verificationResult === 'valid' ? (
                <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">Credential Verified</h3>
                  <p className="text-slate-400">The credential is valid and has been verified with the issuer</p>
                </div>
              ) : (
                <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-8 text-center">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">Verification Failed</h3>
                  <p className="text-slate-400">The credential could not be verified</p>
                </div>
              )}

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h4 className="text-lg font-semibold text-white mb-4">Verified Credential Details</h4>
                <div className="space-y-3">
                  {Object.entries(statement).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-white font-medium break-all text-right ml-4">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-green-700/50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold mb-2">Verification Proof (JWT)</h4>
                    <p className="text-slate-400 text-sm mb-3">
                      The issuer has generated a verifiable credential confirming the authenticity of this statement.
                    </p>
                    <div className="bg-slate-800 rounded-lg p-4 font-mono text-xs text-green-400 break-all">
                      eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1wbG95ZXIiOiJUZWNoQ29ycCBJbmMuIiwic2FsYXJ5IjoiJDEyMCwwMDAiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setStep('employee-connected');
                  setStatement(null);
                  setVerificationResult(null);
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Verify Another Credential
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
