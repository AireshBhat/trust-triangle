import { log } from './log';
import type { API } from './api';

// We want to only ever create the API once, therefore we define a module-level
// singleton that holds the promise to create the API.
// As promises can be awaited any number of times in JavaScript, this gives us
// an async singleton instance to the wasm API.
let apiInstance: Promise<API> | null = null;

export async function initApi(role: 'employee' | 'issuer' | 'verifier', secretKey?: string): Promise<API> {
  if (!apiInstance) {
    apiInstance = importAndInitOnce(role, secretKey);
  }
  return await apiInstance;
}

export function resetApi() {
  apiInstance = null;
}

async function importAndInitOnce(role: 'employee' | 'issuer' | 'verifier', secretKey?: string): Promise<API> {
  try {
    log.info('Importing WASM module');
    const { PeerNodeAPI } = await import('./peer-node');
    return await PeerNodeAPI.create(role, secretKey);
  } catch (err) {
    log.error('Failed to import or launch peer node', err);
    throw err;
  }
}

// Re-export types
export type { 
  API, 
  PeerNodeInfo, 
  Role, 
  AcceptEvent, 
  ConnectEvent,
  PeerConnection,
  ConnectionStatus 
} from './api';

// Re-export storage types and utilities
export type { NodeState } from './storage/storage';
export { storage } from './storage/storage';

// Re-export helper functions
export { generateSecretKey } from './peer-node';

