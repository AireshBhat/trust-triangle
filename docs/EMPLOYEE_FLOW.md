# Employee Flow Documentation

This document describes the Employee (Wallet) view flow for requesting and managing income credentials.

## Flow Overview

```
Employee Enters Wallet View
    ↓
Check Local Employee State
    ↓
Has Issuer & Verifier Node IDs? ──No──→ Show Node Configuration Form
    ↓                                           ↓
   Yes                                    Save Node IDs
    ↓                                           ↓
    └───────────────────────────────────────────┘
                    ↓
            Show Credential List
                    ↓
        "Generate Income Statement" button
                    ↓
        Show Income Credential Form
                    ↓
        Fill/Edit Credential Data
                    ↓
        Click "Request Statement Signature"
                    ↓
        Send to Issuer Node ID
                    ↓
        [Backend Integration - To Be Implemented]
```

## Implementation Details

### 1. Employee Storage (`src/lib/employeeStorage.ts`)

Manages employee-specific configuration using localForage:

- **`EmployeeConfig`**: Interface for storing issuer and verifier node IDs
- **`saveEmployeeConfig()`**: Saves both node IDs
- **`loadEmployeeConfig()`**: Loads stored configuration
- **`clearEmployeeConfig()`**: Clears all employee data
- **`hasCompleteConfig()`**: Checks if configuration is complete

### 2. Income Credential Types (`src/types/incomeCredential.ts`)

Defines the income credential structure:

```typescript
interface IncomeCredentialData {
  // Salary information
  grossSalary: number;
  netSalary: number;
  currency: string;
  
  // Pay period
  payPeriod: string; // Format: "MM/YYYY"
  
  // Payment details
  paymentMode: PaymentMode; // 'bank_transfer' | 'crypto' | 'cash' | 'check' | 'other'
  
  // Employer information
  employerDID: string; // Issuer's Node ID
  payrollProcessorDID: string;
  
  // Employee information (optional)
  employeeName?: string;
  employeeId?: string;
}
```

### 3. Node Configuration View (`src/views/wallet/NodeConfigView.tsx`)

Beautiful UI for configuring node IDs:

**Features:**
- Input fields for Issuer Node ID (Payroll Provider)
- Input field for Verifier Node ID (Verification Service)
- Validation to ensure both fields are filled
- Save button with loading state
- Success/Error feedback
- Info box explaining what Node IDs are
- Pre-filled with existing values if available

**Design:**
- Gradient header with blue theme
- Color-coded sections (Emerald for Issuer, Amber for Verifier)
- Monospace font for node ID inputs
- Responsive design with proper spacing
- Accessible form elements

### 4. Income Credential View (`src/views/wallet/IncomeCredentialView.tsx`)

Comprehensive form for generating income statement requests:

**Features:**
- Connected services display (shows Issuer & Verifier node IDs)
- Employee information fields (name, ID)
- Salary details (gross/net salary with currency selector)
- Pay period input
- Payment mode dropdown
- Issuer details display
- "Request Statement Signature" button

**Pre-filled Example Data:**
- Employee Name: "Sumith Kumar"
- Employee ID: "EMP-12345"
- Gross Salary: $75,000
- Net Salary: $52,500
- Currency: USD
- Payment Mode: Bank Transfer
- Current month/year as pay period

**Design:**
- Large, easy-to-edit form fields
- Color-coded sections for different data types
- Visual feedback during submission
- Error handling and display
- Professional gradient styling

### 5. Updated Wallet View (`src/views/WalletView.tsx`)

Main employee view with complete flow management:

**View States:**
1. **Loading**: Shows spinner while loading configuration
2. **Config**: Node configuration form (shown if no config exists)
3. **List**: Credential list with "Generate Income Statement" button
4. **Generate**: Income credential generation form
5. **Detail**: View credential details
6. **Settings**: Wallet settings with node reconfiguration option

**Flow Logic:**
- On mount, checks for employee configuration
- If missing, shows configuration view
- If present, shows credential list
- "Generate Income Statement" button navigates to generation form
- Settings allows reconfiguring node IDs

### 6. Updated Settings View (`src/views/wallet/WalletSettingsView.tsx`)

Enhanced with node configuration display:

**New Features:**
- Shows employee's node ID (copyable)
- Displays connected services (Issuer & Verifier)
- "Configure" button to update node IDs
- Color-coded service cards

## User Experience Flows

### First-Time Employee

1. **Opens Employee Wallet**
   - Sees "Employee Wallet Setup" screen
   
2. **Enters Node IDs**
   - Pastes Issuer Node ID (from payroll provider)
   - Pastes Verifier Node ID (from verification service)
   - Clicks "Save Configuration"
   
3. **Views Credential List**
   - Sees existing credentials (if any)
   - Sees prominent "Generate Income Statement" button
   
4. **Generates Income Statement**
   - Clicks "Generate Income Statement"
   - Reviews/edits pre-filled credential data
   - Adjusts salary amounts, pay period, etc.
   - Clicks "Request Statement Signature"
   - Request is sent to issuer (backend integration pending)

### Returning Employee

1. **Opens Employee Wallet**
   - Configuration automatically loaded
   - Goes directly to credential list
   
2. **Can immediately:**
   - Generate new income statements
   - View existing credentials
   - Access settings to change node IDs
   - Scan for new credential offers

### Updating Node Configuration

1. **From Credential List**
   - Clicks Settings icon (top right)
   
2. **In Settings**
   - Views current connected services
   - Clicks "Configure" button
   
3. **Updates Node IDs**
   - Modifies Issuer or Verifier node IDs
   - Saves changes
   - Returns to credential list

## Income Credential Schema

As per the requirements, the credential includes:

**Purpose:** Proof of income earned from a verified employer

**Fields:**
- **Gross salary**: Total income before deductions
- **Net salary**: Income after deductions
- **Currency**: USD, EUR, GBP, INR, etc.
- **Pay period**: Month/Year format (e.g., "10/2025")
- **Payment mode**: Bank transfer, crypto, cash, check, or other
- **Employer DID**: The issuer's node ID (who will sign the credential)
- **Payroll Processor DID**: Could be same as employer or different entity

## Backend Integration (To Be Implemented)

When the backend is ready, the following will be implemented:

1. **Credential Request Sending:**
   ```typescript
   // In handleGenerateStatement()
   const response = await api.connect(
     employeeConfig.issuerNodeId,
     JSON.stringify({
       type: 'income_credential_request',
       data: credentialData
     })
   );
   ```

2. **Event Listening:**
   - Listen for issuer's response
   - Handle signed credential
   - Store credential locally
   - Update credential list

3. **Credential Storage:**
   - Save signed credentials to localForage
   - Display in credential list
   - Allow viewing and sharing

## Technical Notes

- Uses **localForage** for persistent storage of node IDs
- Separate storage instances for app state vs employee config
- Type-safe implementation with TypeScript
- Proper error handling throughout
- Logging integrated for debugging
- Mobile-responsive design
- Accessible UI components

## Files Created/Modified

**New Files:**
- `src/lib/employeeStorage.ts` - Employee configuration storage
- `src/types/incomeCredential.ts` - Income credential type definitions
- `src/views/wallet/NodeConfigView.tsx` - Node ID configuration UI
- `src/views/wallet/IncomeCredentialView.tsx` - Income credential form

**Modified Files:**
- `src/views/WalletView.tsx` - Added new flow logic
- `src/views/wallet/WalletSettingsView.tsx` - Added node config display

## Testing the Flow

1. Run the app: `npm run dev`
2. Select "Employee Wallet" role
3. Enter dummy node IDs:
   - Issuer: `test-issuer-node-id-12345`
   - Verifier: `test-verifier-node-id-67890`
4. Click "Save Configuration"
5. Click "Generate Income Statement"
6. Review the pre-filled form
7. Modify values as needed
8. Click "Request Statement Signature"
9. See placeholder alert (backend integration pending)

## Next Steps

1. Implement backend credential request handling
2. Add credential storage and retrieval
3. Implement credential verification flow
4. Add QR code scanning for credential offers
5. Add presentation request handling

