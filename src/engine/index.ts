import { WorkerClient } from "../workers/client";
import { CoreWorkerAPI } from "../workers/client/type";
import { AddSourceDto } from "../workers/module/dto/source-dto";

export class Engine {
  private _coreClient: WorkerClient<CoreWorkerAPI>;

  public constructor() {
    this._coreClient = new WorkerClient(
      new URL("../workers/server/core.worker.ts", import.meta.url),
    );
  }

  public readonly sources = {
    add: async (payload: AddSourceDto) => {
      return await this._coreClient.call("addSource", payload);
    },
  };
}

export const engine = new Engine();
