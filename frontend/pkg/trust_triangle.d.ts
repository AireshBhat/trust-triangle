/* tslint:disable */
/* eslint-disable */
export function start(): void;
export function generate_key(): string;
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */
type ReadableStreamType = "bytes";
export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  start(controller: ReadableByteStreamController): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  cancel(): void;
  readonly type: ReadableStreamType;
  readonly autoAllocateChunkSize: number;
}
export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  write(chunk: any): Promise<any>;
  close(): Promise<any>;
  abort(reason: any): Promise<any>;
}
export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}
export class PeerNode {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Spawns a new peer node.
   * 
   * # Arguments
   * * `secret_key_str` - Optional hex-encoded secret key string. If None, a new key is generated.
   * * `role_str` - The role as a string: "employee", "issuer", or "verifier"
   */
  static spawn(secret_key_str: string | null | undefined, role_str: string): Promise<PeerNode>;
  events(): ReadableStream;
  node_id(): string;
  secret_key(): string;
  connect(node_id: string, payload: string): ReadableStream;
  /**
   * Get all pending credential requests (returns JSON string)
   */
  get_pending_requests(): Promise<string>;
  /**
   * Approve a pending credential request
   */
  approve_request(request_id: string): Promise<void>;
  /**
   * Reject a pending credential request
   */
  reject_request(request_id: string, reason?: string | null): Promise<void>;
  /**
   * Add a trusted issuer
   */
  add_trusted_issuer(node_id: string): Promise<void>;
  /**
   * Remove a trusted issuer
   */
  remove_trusted_issuer(node_id: string): Promise<void>;
  /**
   * Check if an issuer is trusted
   */
  is_trusted_issuer(node_id: string): Promise<boolean>;
  /**
   * Get all trusted issuers (returns JSON string array)
   */
  get_trusted_issuers(): Promise<string>;
  /**
   * Get all verified credentials (returns JSON string)
   */
  get_verified_credentials(): Promise<string>;
  /**
   * Get a specific verified credential by presentation ID (returns JSON string or null)
   */
  get_verified_credential(presentation_id: string): Promise<string | undefined>;
  /**
   * Get all received credentials (returns JSON string)
   */
  get_received_credentials(): Promise<string>;
  /**
   * Get a specific received credential by request ID (returns JSON string or null)
   */
  get_received_credential(request_id: string): Promise<string | undefined>;
}
