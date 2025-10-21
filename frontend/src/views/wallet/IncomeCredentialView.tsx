import { useState } from 'react';
import { ArrowLeft, FileText, DollarSign, Calendar, CreditCard, Send, Loader2, Building2, CheckCircle } from 'lucide-react';
import type { EmployeeConfig } from '../../lib/storage/employeeStorage';
import type { IncomeCredentialData, PaymentMode } from '../../types/incomeCredential';
import { CURRENCY_OPTIONS, PAYMENT_MODE_OPTIONS } from '../../types/incomeCredential';
import { log } from '../../lib/log';
import { createIssueRequest, generateRequestId } from '../../lib';
import type { API } from '../../lib';

interface IncomeCredentialViewProps {
  api: API; // The single app-wide API instance
  employeeConfig: EmployeeConfig;
  onBack: () => void;
  onRequestSent?: () => void;
}

export default function IncomeCredentialView({ 
  api,
  employeeConfig, 
  onBack,
  onRequestSent 
}: IncomeCredentialViewProps) {
  // Get current month/year for default pay period
  const getCurrentPayPeriod = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}/${year}`;
  };

  // Form state with example data
  const [formData, setFormData] = useState<Omit<IncomeCredentialData, 'employerDID' | 'payrollProcessorDID'>>({
    employeeName: 'Sumith Kumar',
    employeeId: 'EMP-12345',
    grossSalary: 75000,
    netSalary: 52500,
    currency: 'INR',
    payPeriod: getCurrentPayPeriod(),
    paymentMode: 'bank_transfer' as PaymentMode,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.employeeName?.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.grossSalary || formData.grossSalary <= 0) {
      setError('Please enter a valid gross salary');
      return;
    }
    if (!formData.netSalary || formData.netSalary <= 0) {
      setError('Please enter a valid net salary');
      return;
    }
    if (formData.netSalary > formData.grossSalary) {
      setError('Net salary cannot exceed gross salary');
      return;
    }
    if (!formData.payPeriod.trim()) {
      setError('Please enter a pay period');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Get employee's node info
      const nodeInfo = api.getNodeInfo();
      if (!nodeInfo) {
        throw new Error('Node not initialized');
      }

      log.info(`Requesting income credential for ${formData.employeeName}`);

      // Convert pay period from MM/YYYY to YYYY-MM format for backend
      const [month, year] = formData.payPeriod.split('/');
      const payPeriodFormatted = `${year}-${month.padStart(2, '0')}`;

      // Generate request ID
      const requestId = generateRequestId();

      // Create credential request using helper function
      const requestPayload = createIssueRequest({
        requestId,
        employeeNodeId: nodeInfo.nodeId,
        employeeName: formData.employeeName,
        grossSalary: formData.grossSalary.toString(),
        netSalary: formData.netSalary.toString(),
        currency: formData.currency,
        payPeriod: payPeriodFormatted,
        paymentMode: formData.paymentMode,
      });

      log.info(`Sending credential request to issuer: ${employeeConfig.issuerNodeId}`);
      log.info(`Request ID: ${requestId}`);

      // Send request to issuer
      await api.connect(employeeConfig.issuerNodeId, requestPayload);

      log.info('✅ Income credential request sent successfully');
      
      // Store request ID for tracking
      localStorage.setItem(`pending_request_${requestId}`, JSON.stringify({
        requestId,
        employeeName: formData.employeeName,
        timestamp: new Date().toISOString(),
        status: 'pending',
      }));

      // Show success and call callback
      if (onRequestSent) {
        onRequestSent();
      } else {
        alert(`✅ Statement request sent to issuer!\n\nRequest ID: ${requestId.substring(0, 8)}...\n\nYou will be notified when the issuer approves or rejects your request.`);
        onBack();
      }
    } catch (err) {
      log.error('Failed to send credential request', err);
      setError(err instanceof Error ? err.message : 'Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Generate Income Statement</h2>
          <p className="text-slate-400">Request a signed credential from your employer</p>
        </div>
      </div>

      {/* Connected Services Info */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Connected Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-emerald-900/20 rounded-lg border border-emerald-700/30">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Issuer (Payroll Provider)</p>
              <p className="text-sm text-white font-mono truncate">{employeeConfig.issuerNodeId.substring(0, 16)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-amber-900/20 rounded-lg border border-amber-700/30">
            <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Verifier</p>
              <p className="text-sm text-white font-mono truncate">{employeeConfig.verifierNodeId.substring(0, 16)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Employee Information */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Employee Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Employee Name
              </label>
              <input
                type="text"
                value={formData.employeeName || ''}
                onChange={(e) => handleInputChange('employeeName', e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                value={formData.employeeId || ''}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                placeholder="Enter your employee ID"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Salary Details */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Salary Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gross Salary
              </label>
              <input
                type="number"
                value={formData.grossSalary}
                onChange={(e) => handleInputChange('grossSalary', parseFloat(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Net Salary
              </label>
              <input
                type="number"
                value={formData.netSalary}
                onChange={(e) => handleInputChange('netSalary', parseFloat(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {CURRENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deduction calculation */}
          {formData.grossSalary > 0 && formData.netSalary > 0 && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">
                Total Deductions: <span className="text-white font-medium">
                  {formData.currency} {(formData.grossSalary - formData.netSalary).toFixed(2)}
                </span>
                {' '}({((1 - formData.netSalary / formData.grossSalary) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
        </div>

        {/* Pay Period & Payment Mode */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <label className="text-sm font-medium text-slate-300">
                  Pay Period (MM/YYYY)
                </label>
              </div>
              <input
                type="text"
                value={formData.payPeriod}
                onChange={(e) => handleInputChange('payPeriod', e.target.value)}
                placeholder="MM/YYYY"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <label className="text-sm font-medium text-slate-300">
                  Payment Mode
                </label>
              </div>
              <select
                value={formData.paymentMode}
                onChange={(e) => handleInputChange('paymentMode', e.target.value as PaymentMode)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {PAYMENT_MODE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Issuer Info (Read-only) */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Issuer Details</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Employer DID (Issuer Node ID)
              </label>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 font-mono text-sm break-all">
                {employeeConfig.issuerNodeId}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Payroll Processor DID
              </label>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-300 font-mono text-sm break-all">
                {employeeConfig.issuerNodeId}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Currently same as Employer DID
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Request to Issuer...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Request Statement Signature
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate-500">
        This will send a credential request to your payroll provider for signature
      </p>
    </div>
  );
}

