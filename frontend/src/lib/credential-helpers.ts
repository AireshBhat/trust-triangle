import type { CredentialMessage, PaymentMode } from './api';

/**
 * Helper functions for creating credential messages
 */

export interface IssueRequestParams {
  requestId: string;
  employeeNodeId: string;
  employeeName: string;
  grossSalary: string;
  netSalary: string;
  currency: string;
  payPeriod: string;
  paymentMode: PaymentMode;
}

export interface PresentCredentialParams {
  presentationId: string;
  credential: any; // SignedIncomeCredential
}

/**
 * Create an issue request message for employee to send to issuer
 */
export function createIssueRequest(params: IssueRequestParams): string {
  const message: CredentialMessage = {
    type: 'issueRequest',
    requestId: params.requestId,
    employeeNodeId: params.employeeNodeId,
    employeeName: params.employeeName,
    grossSalary: params.grossSalary,
    netSalary: params.netSalary,
    currency: params.currency,
    payPeriod: params.payPeriod,
    paymentMode: params.paymentMode,
  };
  return JSON.stringify(message);
}

/**
 * Create a present credential message for employee to send to verifier
 */
export function createPresentCredential(params: PresentCredentialParams): string {
  const message: CredentialMessage = {
    type: 'presentCredential',
    presentationId: params.presentationId,
    credential: params.credential,
  };
  return JSON.stringify(message);
}

/**
 * Parse a credential message from JSON string
 */
export function parseCredentialMessage(json: string): CredentialMessage {
  return JSON.parse(json) as CredentialMessage;
}

/**
 * Generate a unique request ID (UUID v4)
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Format salary amount for display
 */
export function formatSalary(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num);
}

/**
 * Format payment mode for display
 */
export function formatPaymentMode(mode: PaymentMode): string {
  const modeMap: Record<PaymentMode, string> = {
    bank_transfer: 'Bank Transfer',
    crypto: 'Cryptocurrency',
    check: 'Check',
    cash: 'Cash',
    other: 'Other',
  };
  return modeMap[mode] || mode;
}

/**
 * Format pay period for display (YYYY-MM format)
 */
export function formatPayPeriod(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

/**
 * Validate salary amount
 */
export function validateSalary(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate pay period format (YYYY-MM)
 */
export function validatePayPeriod(period: string): boolean {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(period)) return false;
  
  const [year, month] = period.split('-').map(Number);
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
}

