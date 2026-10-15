import { AnySource } from "../../types/source";
import { AddSourceDto } from "../module/dto/source-dto";

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

export const TRANSFER = Symbol("transfer");

export type WithTransfer<T> = T & {
  [TRANSFER]?: Transferable[];
};

export interface WorkerAPIExample {
  sayHello(payload: { name: string }): string;
  add(payload: { a: number; b: number }): number;
  seek(payload: { timestamp: number; exact?: boolean }): Promise<void>;
  pause(): void;
}

export interface CoreWorkerAPI {
  addSource: (payload: AddSourceDto) => Promise<AnySource>;
}
