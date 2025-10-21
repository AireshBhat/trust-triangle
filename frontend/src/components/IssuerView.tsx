import { useState, useEffect } from 'react';
import { ArrowLeft, FileCheck, Clock, Users, CheckCircle, FileText } from 'lucide-react';
import { initApi } from '../lib';
import NodeIdDisplay from './NodeIdDisplay';
import { log } from '../lib/log';

interface IssuerViewProps {
  onBack: () => void;
}

type IssuerStep = 'waiting-connection' | 'employee-connected' | 'signing-statement' | 'statement-signed';

interface StatementForm {
  employerName: string;
  employeeName: string;
  grossSalary: string;
  netSalary: string;
  currency: string;
  payPeriod: string;
}

export default function IssuerView({ onBack }: IssuerViewProps) {
  const [step, setStep] = useState<IssuerStep>('waiting-connection');
  const [employeeNodeId, setEmployeeNodeId] = useState('');
  const [nodeId, setNodeId] = useState<string>('');
  const [statementForm, setStatementForm] = useState<StatementForm>({
    employerName: '',
    employeeName: '',
    grossSalary: '',
    netSalary: '',
    currency: 'INR',
    payPeriod: 'Annual',
  });

  // Load node ID on mount
  useEffect(() => {
    loadNodeId();
  }, []);

  const loadNodeId = async () => {
    try {
      const api = await initApi('issuer');
      const info = api.getNodeInfo();
      if (info) {
        setNodeId(info.nodeId);
      }
    } catch (error) {
      log.error('Failed to get node ID', error);
    }
  };

  const handleEmployeeConnect = () => {
    setEmployeeNodeId('employee-' + Math.random().toString(36).substring(7));
    setStep('employee-connected');
  };

  const handleFormChange = (field: keyof StatementForm, value: string) => {
    setStatementForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignStatement = () => {
    setStep('signing-statement');
    setTimeout(() => {
      setStep('statement-signed');
    }, 1500);
  };

  const isFormValid = () => {
    return Object.values(statementForm).every((val) => val.trim() !== '');
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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
              <FileCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Issuer Dashboard</h1>
              <p className="text-slate-400">Issue verifiable credentials to employees</p>
            </div>
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

          {step === 'waiting-connection' && (
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
                <Clock className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-xl font-semibold text-white mb-2">Waiting for Employee Connection</h3>
                <p className="text-slate-400 mb-6">Listening for incoming P2P connections from employees</p>

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
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-green-300">Employee Connected: {employeeNodeId}</span>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-xl font-semibold text-white">Create Statement</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Employer Name</label>
                      <input
                        type="text"
                        value={statementForm.employerName}
                        onChange={(e) => handleFormChange('employerName', e.target.value)}
                        placeholder="e.g., TechCorp Inc."
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Employee Name</label>
                      <input
                        type="text"
                        value={statementForm.employeeName}
                        onChange={(e) => handleFormChange('employeeName', e.target.value)}
                        placeholder="e.g., John Doe"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Gross Salary</label>
                      <input
                        type="text"
                        value={statementForm.grossSalary}
                        onChange={(e) => handleFormChange('grossSalary', e.target.value)}
                        placeholder="e.g., $120,000"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Net Salary</label>
                      <input
                        type="text"
                        value={statementForm.netSalary}
                        onChange={(e) => handleFormChange('netSalary', e.target.value)}
                        placeholder="e.g., $95,000"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Currency</label>
                      <select
                        value={statementForm.currency}
                        onChange={(e) => handleFormChange('currency', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Pay Period</label>
                      <select
                        value={statementForm.payPeriod}
                        onChange={(e) => handleFormChange('payPeriod', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="Annual">Annual</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Bi-weekly">Bi-weekly</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignStatement}
                disabled={!isFormValid()}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCheck className="w-5 h-5" />
                Sign and Issue Statement
              </button>
            </div>
          )}

          {step === 'signing-statement' && (
            <div className="bg-slate-900/50 rounded-xl p-8 border border-slate-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <FileCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Signing Statement</h3>
              <p className="text-slate-400">Creating cryptographic signature...</p>
            </div>
          )}

          {step === 'statement-signed' && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Statement Issued Successfully</h3>
                <p className="text-slate-400">The signed credential has been sent to the employee</p>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h4 className="text-lg font-semibold text-white mb-4">Issued Statement Details</h4>
                <div className="space-y-3">
                  {Object.entries(statementForm).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('employee-connected')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Issue Another Statement
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
