# Application Flow

This document describes the initialization and navigation flow of the Trust Triangle application.

## Flow Diagram

```
┌─────────────┐
│  Start App  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Load Local State │  ← Check localforage for saved NodeState
└──────┬───────────┘
       │
       ▼
   ┌───────────┐
   │   Role    │
   │ Selected? │  ← Does localforage have role + secretKey?
   └─────┬─────┘
         │
    ┌────┴────┐
    │         │
   No        Yes
    │         │
    │         ▼
    │  ┌──────────────┐
    │  │Select Employee│
    │  │Select Issuer  │
    │  │Select Verifier│
    │  └──────┬────────┘
    │         │
    │         ▼
    └────►┌────────────────┐
          │ Load Node State│  ← Initialize peer node with role + secretKey
          └────────┬───────┘
                   │
                   ▼
          ┌───────────────┐
          │ Load Home Page│  ← Role-specific view (Employee/Issuer/Verifier)
          └───────────────┘
```

## State Machine

The app uses a state machine with the following states:

### 1. **Loading** (`status: 'loading'`)
- **Entry**: App starts
- **Action**: Load node state from localforage
- **Exit**: 
  - If state found → `initializing-node`
  - If no state → `role-selection`

### 2. **Role Selection** (`status: 'role-selection'`)
- **Entry**: No saved state or user clicked "Back"
- **Display**: Three role cards (Employee, Issuer, Verifier)
- **Action**: User selects a role
- **Exit**: → `initializing-node`

### 3. **Initializing Node** (`status: 'initializing-node'`)
- **Entry**: 
  - From `loading` (with saved state)
  - From `role-selection` (new selection)
- **Display**: Loading spinner with message
- **Action**: 
  - Call `initApi(role, secretKey?)` to spawn peer node
  - Save NodeState to localforage
- **Exit**: 
  - Success → `ready`
  - Error → `role-selection`

### 4. **Ready** (`status: 'ready'`)
- **Entry**: Node successfully initialized
- **Display**: Role-specific home view
- **Routes**:
  - `role === 'employee'` → EmployeeView
  - `role === 'issuer'` → IssuerView
  - `role === 'verifier'` → VerifierView
- **Exit**: User clicks "Back" → clear state → `role-selection`

## Data Persistence

### NodeState Structure
```typescript
interface NodeState {
  role: Role;           // 'employee' | 'issuer' | 'verifier'
  secretKey: string;    // Hex-encoded secret key
  nodeId: string;       // Derived from secret key
  createdAt: string;    // ISO timestamp
}
```

### Storage Keys
- `nodeState` - Complete node state (role, keys, ID)
- Stored using **localforage** for better IndexedDB support

### When State is Saved
- After successful peer node initialization
- When user selects a role and node spawns

### When State is Cleared
- User clicks "Back to Role Selection"
- Node initialization fails (auto-cleanup)

## Component Structure

```
App.tsx
├── LoadingScreen           (status: loading | initializing-node)
├── RoleSelection           (status: role-selection)
│   └── Role cards × 3
└── Ready State             (status: ready)
    ├── EmployeeView        (role: employee)
    ├── IssuerView          (role: issuer)
    └── VerifierView        (role: verifier)
```

## API Integration

### Initialization Flow
1. App loads → check localforage
2. If NodeState exists:
   - Extract `role` and `secretKey`
   - Call `initApi(role, secretKey)`
   - API spawns peer node with existing identity
3. If no NodeState:
   - Show role selection
   - User selects role
   - Call `initApi(role)` (generates new secretKey)
   - Save NodeState

### Persistence Benefits
- **Same Node ID**: Using saved `secretKey` ensures the same node ID on reload
- **Network Identity**: Other peers recognize this node across sessions
- **No Re-registration**: No need to re-establish connections

## Error Handling

### Failed Initialization
```typescript
try {
  await initApi(role, secretKey);
} catch (error) {
  // Clear invalid state
  await storage.clearNodeState();
  // Return to role selection
  setAppState({ status: 'role-selection' });
}
```

### Invalid Saved State
If saved state exists but fails to initialize:
1. Log error
2. Clear corrupted state
3. Show role selection for fresh start

## User Actions

### First Time User
1. Sees role selection immediately
2. Selects a role (e.g., Employee)
3. App spawns new node, generates keys
4. State saved to localforage
5. Home view appears

### Returning User
1. App loads saved state automatically
2. Shows "Initializing..." briefly
3. Node spawns with saved identity
4. Home view appears
5. Same Node ID as before

### Switching Roles
1. User clicks "Back" button
2. App clears saved state
3. Returns to role selection
4. User can select different role
5. New identity created

## Security Considerations

- Secret keys stored in browser's IndexedDB (via localforage)
- Keys never leave the device
- Each role/device has unique identity
- No central authentication server
- P2P communication only

## Future Enhancements

- [ ] Multiple profiles (switch between identities)
- [ ] Export/import keys (backup/restore)
- [ ] Key encryption with password
- [ ] Session timeout and re-authentication
- [ ] Migration from localStorage to localforage

