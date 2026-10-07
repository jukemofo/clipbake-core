import type { RPCRequest, RPCResponse } from "./type";

export class WorkerClient<T> {
  private worker: Worker;
  private reqId = 0;
  private pending = new Map<number, { resolve: Function; reject: Function }>();

  constructor(workerScriptUrl: string) {
    this.worker = new Worker(new URL(workerScriptUrl, import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (e: MessageEvent<RPCResponse>) => {
      const { id, result, error } = e.data;
      const promise = this.pending.get(id);
      if (promise) {
        if (error) promise.reject(new Error(error));
        else promise.resolve(result);
        this.pending.delete(id);
      }
    };
  }

  public call<K extends keyof T>(
    method: K,
    ...args: Parameters<Extract<T[K], (...args: any[]) => any>> extends [
      infer P,
    ]
      ? [payload: P, transferList?: Transferable[]]
      : []
  ): Promise<Awaited<ReturnType<Extract<T[K], (...args: any[]) => any>>>> {
    const [payload, transferList] = args as [any?, Transferable[]?];

    const id = ++this.reqId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const request: RPCRequest = { id, method: method as string, payload };

      this.worker.postMessage(request, transferList ?? []);
    });
  }
}
