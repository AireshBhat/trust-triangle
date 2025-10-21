import localforage from 'localforage';
import type { Role } from '../api';

// Configure localforage
localforage.config({
  name: 'trust-triangle',
  storeName: 'app_state',
  description: 'Trust Triangle application state'
});

export interface NodeState {
  role: Role;
  secretKey: string;
  nodeId: string;
  createdAt: string;
}

const KEYS = {
  NODE_STATE: 'nodeState',
  SELECTED_ROLE: 'selectedRole',
} as const;

/**
 * Storage utility for persisting application state
 */
export const storage = {
  /**
   * Save node state (role, secret key, node ID)
   */
  async saveNodeState(state: NodeState): Promise<void> {
    await localforage.setItem(KEYS.NODE_STATE, state);
  },

  /**
   * Load node state from storage
   */
  async loadNodeState(): Promise<NodeState | null> {
    return await localforage.getItem<NodeState>(KEYS.NODE_STATE);
  },

  /**
   * Clear node state
   */
  async clearNodeState(): Promise<void> {
    await localforage.removeItem(KEYS.NODE_STATE);
  },

  /**
   * Save selected role (for temporary state before node initialization)
   */
  async saveSelectedRole(role: Role): Promise<void> {
    await localforage.setItem(KEYS.SELECTED_ROLE, role);
  },

  /**
   * Load selected role
   */
  async loadSelectedRole(): Promise<Role | null> {
    return await localforage.getItem<Role>(KEYS.SELECTED_ROLE);
  },

  /**
   * Clear selected role
   */
  async clearSelectedRole(): Promise<void> {
    await localforage.removeItem(KEYS.SELECTED_ROLE);
  },

  /**
   * Clear all storage
   */
  async clearAll(): Promise<void> {
    await localforage.clear();
  }
};

