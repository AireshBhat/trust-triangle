/**
 * Income Credential Types
 * 
 * Defines the structure for proof of income credentials
 * as per the Trust Triangle specification
 */

export type PaymentMode = 
  | 'bank_transfer'
  | 'crypto'
  | 'cash'
  | 'check'
  | 'other';

export interface IncomeCredentialData {
  // Salary information
  grossSalary: number;
  netSalary: number;
  currency: string;
  
  // Pay period (format: MM/YYYY)
  payPeriod: string;
  
  // Payment details
  paymentMode: PaymentMode;
  
  // Issuer information (DIDs/Node IDs)
  employerDID: string; // Issuer's node ID
  payrollProcessorDID: string;
  
  // Optional employee information
  employeeName?: string;
  employeeId?: string;
}

export interface IncomeCredentialRequest {
  type: 'income_credential_request';
  data: IncomeCredentialData;
  timestamp: string;
  requestId: string;
}

export interface SignedIncomeCredential extends IncomeCredentialData {
  id: string;
  signature: string;
  issuedAt: string;
  expiresAt?: string;
  status: 'pending' | 'signed' | 'rejected';
}

// Helper type for form state
export type IncomeCredentialFormData = Omit<IncomeCredentialData, 'employerDID' | 'payrollProcessorDID'>;

// Currency options for dropdown
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
] as const;

// Payment mode options for dropdown
export const PAYMENT_MODE_OPTIONS: Array<{ value: PaymentMode; label: string }> = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
] as const;

