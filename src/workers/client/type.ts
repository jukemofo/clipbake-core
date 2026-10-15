import { AnySource } from "../../types/source";
import { AnyTrack } from "../../types/track";
import {
  InitEngineDto,
  SeekEngineDto,
  StartEngineDto,
  StopEngineDto,
} from "../module/dto/engine-dto";
import { AddSourceDto } from "../module/dto/source-dto";
import { AddTrackDto } from "../module/dto/track-dto";

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
  init: (payload: InitEngineDto) => Promise<void>;
  addSource: (payload: AddSourceDto) => Promise<AnySource>;
  addTrack: (payload: AddTrackDto) => Promise<AnyTrack>;
  start: (payload: StartEngineDto) => Promise<void>;
  stop: (payload: StopEngineDto) => Promise<void>;
  seek: (payload: SeekEngineDto) => Promise<void>;
}
