# Initial Loader Flow Implementation

This document describes the implemented initial loader flow for the Trust Triangle application.

## Flow Overview

The application follows the flow diagram provided:

```
Start App
    ↓
Load Local State
    ↓
Role Selected? ──No──→ Select Role ──→ Load Node State
    ↓                       ↓                  ↓
   Yes                      ↓                  ↓
    ↓                       ↓                  ↓
    └───────────────────────┴──────────────────┘
                            ↓
                    Load Home Page
```

## Implementation Details

### 1. Storage Layer (`src/lib/storage.ts`)

Created a storage utility using **localForage** to manage persistent state:

- **`LocalState` interface**: Stores role, secretKey, and nodeId
- **`saveLocalState()`**: Saves the user's role and secret key to local storage
- **`loadLocalState()`**: Retrieves the stored state (returns `null` if not found)
- **`clearLocalState()`**: Clears all stored data (used when user goes back to role selection)
- **`hasStoredRole()`**: Quick check if a role is already selected

### 2. App Component (`src/App.tsx`)

The main application component now implements the complete flow:

#### Initial Loader (useEffect)
1. **Load Local State**: Attempts to load role and secret key from localStorage
2. **Check if Role Selected**:
   - **If YES**: 
     - Creates a `PeerNodeAPI` instance
     - Spawns a peer node using the stored secret key
     - Updates the stored node ID if it changed
     - Navigates to the appropriate profile screen based on role:
       - `employee` → Wallet View
       - `issuer` → Issuer View
       - `verifier` → Verifier View
   - **If NO**: Shows the role selection screen (HomeView)

#### Role Selection Handler
When a user selects a role from HomeView:
1. Creates a new `PeerNodeAPI` instance
2. Spawns a new peer node (generates a new secret key)
3. Saves the role, secret key, and node ID to localStorage
4. Navigates to the appropriate profile screen

#### Back to Home Handler
When a user presses the back button:
1. Clears all local storage
2. Destroys the peer node API instance
3. Returns to role selection screen

### 3. Home View (`src/views/HomeView.tsx`)

Updated to:
- Accept a `Role` type instead of view names
- Passes the actual role (`'employee'`, `'issuer'`, `'verifier'`) to the parent component

### 4. Profile Views

All three profile views (`WalletView`, `IssuerView`, `VerifierView`) now:
- Accept an `api` prop (PeerNodeAPI instance)
- Can use the API to perform peer-to-peer operations
- Call `onBack()` to return to role selection (which clears local state)

## User Experience

### First Time User
1. App loads with a loading spinner
2. No local state found → Shows role selection screen
3. User selects a role (e.g., "Employee Wallet")
4. Peer node spawns and state is saved
5. User is navigated to the Employee Wallet screen

### Returning User
1. App loads with a loading spinner
2. Local state found with saved role
3. Peer node spawns using the saved secret key
4. User is automatically navigated to their previous role's screen
5. User continues from where they left off

### Switching Roles
1. User presses the back button on any profile screen
2. Local state is cleared
3. User returns to role selection screen
4. User can select a different role

## Benefits

1. **Seamless Experience**: Users don't need to select their role every time
2. **Persistent Identity**: The secret key is preserved, maintaining the user's identity
3. **Flexibility**: Users can easily switch roles by going back to home
4. **Error Handling**: If peer node spawning fails, the app gracefully falls back to role selection
5. **Clean State Management**: All state is managed through localStorage with proper cleanup

## Technical Notes

- Uses **localForage** for asynchronous localStorage operations
- Implements proper error handling throughout the flow
- Logging is integrated for debugging and monitoring
- Type-safe implementation with TypeScript
- Follows React best practices with hooks and functional components

