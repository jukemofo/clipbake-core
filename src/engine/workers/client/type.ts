export interface RPCRequest {
  id: number;
  method: string;
  payload?: any;
}

export interface RPCResponse {
  id: number;
  result?: any;
  error?: string;
}

export interface WorkerAPI {
  sayHello(payload: { name: string }): string;
  add(payload: { a: number; b: number }): number;
  seek(payload: { timestamp: number; exact?: boolean }): Promise<void>;
  pause(): void;
}
