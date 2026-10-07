import { WorkerClient } from "./engine/workers/client";
import { WorkerAPI } from "./engine/workers/client/type";

export { engine } from "./engine";

const client = new WorkerClient<WorkerAPI>("./worker.ts");
