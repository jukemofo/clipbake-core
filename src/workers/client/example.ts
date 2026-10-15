/// <reference lib="webworker" />

import type { RPCRequest, RPCResponse, WorkerAPIExample } from "./type";

// Khóa type WorkerAPI vào đây để bắt buộc Worker phải viết đúng signature
const methods: WorkerAPIExample = {
  sayHello: ({ name }) => {
    return `Xin chào ${name}!`;
  },

  add: ({ a, b }) => {
    return a + b;
  },

  seek: async ({ timestamp, exact = false }) => {
    // Xử lý seek...
  },

  pause: () => {
    // Dừng...
  },
};

self.onmessage = async (e: MessageEvent<RPCRequest>) => {
  const { id, method, payload } = e.data;

  try {
    const fn = (methods as any)[method];
    if (!fn) throw new Error(`Method ${method} không tồn tại`);

    // Gọi hàm với đúng 1 payload duy nhất
    const result = await fn(payload);

    self.postMessage({ id, result } satisfies RPCResponse);
  } catch (err: any) {
    self.postMessage({ id, error: err.message } satisfies RPCResponse);
  }
};
