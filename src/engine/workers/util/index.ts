import { WorkerToMainMessage } from "../types";

export function sendToMain(message: WorkerToMainMessage) {
  self.postMessage(message);
}
