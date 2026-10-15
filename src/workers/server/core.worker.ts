/// <reference lib="webworker" />

import { CoreWorkerAPI, RPCRequest, RPCResponse } from "../client/type";
import { apiController } from "../module/api-controller";
import { popTransfer } from "../utils/transfer";

const taskQueue = Promise.resolve();

const methods: CoreWorkerAPI = {
  init: async (payload) => {
    await apiController.engine.init(payload);
  },

  start: async (payload) => {
    await apiController.engine.start(payload);
  },
  stop: async (payload) => {
    await apiController.engine.stop(payload);
  },
  seek: async (payload) => {
    await apiController.engine.seek(payload);
  },
  addSource: async (payload) => {
    const result = await apiController.sources.add(payload);
    return result;
  },
  addTrack: async (payload) => {
    const result = apiController.tracks.add(payload);
    return result;
  },
};

self.onmessage = (e: MessageEvent<RPCRequest>) => {
  const { id, method, payload } = e.data;

  taskQueue.then(async () => {
    try {
      const fn = (methods as any)[method];
      if (!fn) throw new Error(`Method ${method} not existed`);
      const result = await fn(payload);
      const transfer = popTransfer(result);
      self.postMessage({ id, result } satisfies RPCResponse, transfer);
    } catch (err: any) {
      self.postMessage({ id, error: err.message } satisfies RPCResponse);
    }
  });
};
