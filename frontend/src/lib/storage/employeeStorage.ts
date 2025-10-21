import localforage from 'localforage';
import { log } from '../log';

// Configure localforage for employee-specific data
const employeeStore = localforage.createInstance({
  name: 'trust-triangle',
  storeName: 'employee_data',
  description: 'Employee wallet configuration and credentials'
});

export interface EmployeeConfig {
  issuerNodeId: string;
  verifierNodeId: string;
  updatedAt: string;
}

const KEYS = {
  EMPLOYEE_CONFIG: 'employeeConfig',
} as const;

/**
 * Storage utility for employee-specific data
 */
export const employeeStorage = {
  /**
   * Save employee configuration (issuer and verifier node IDs)
   */
  async saveEmployeeConfig(config: Omit<EmployeeConfig, 'updatedAt'>): Promise<void> {
    const fullConfig: EmployeeConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    await employeeStore.setItem(KEYS.EMPLOYEE_CONFIG, fullConfig);
    log.info('Employee configuration saved');
  },

  /**
   * Load employee configuration
   */
  async loadEmployeeConfig(): Promise<EmployeeConfig | null> {
    return await employeeStore.getItem<EmployeeConfig>(KEYS.EMPLOYEE_CONFIG);
  },

  /**
   * Check if employee has complete configuration
   */
  async hasCompleteConfig(): Promise<boolean> {
    const config = await this.loadEmployeeConfig();
    return !!(config?.issuerNodeId && config?.verifierNodeId);
  },

  /**
   * Clear employee configuration
   */
  async clearEmployeeConfig(): Promise<void> {
    await employeeStore.removeItem(KEYS.EMPLOYEE_CONFIG);
    log.info('Employee configuration cleared');
  },

  /**
   * Clear all employee data
   */
  async clearAll(): Promise<void> {
    await employeeStore.clear();
    log.info('All employee data cleared');
  }
};

