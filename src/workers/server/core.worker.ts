/// <reference lib="webworker" />

import { CoreWorkerAPI, RPCRequest, RPCResponse } from "../client/type";
import { apiController } from "../module/api-controller";
import { popTransfer, withTransfer } from "../utils/transfer";

const taskQueue = Promise.resolve();

const methods: CoreWorkerAPI = {
  addSource: async (payload) => {
    const result = await apiController.source.add(payload);
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
