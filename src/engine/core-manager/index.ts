import { EngineCoordinator } from "..";
import { MainToWorkerMessage, WorkerToMainMessage } from "../workers/types";
import { MediaClipProperty } from "./clip";

type AddVideoSourceParams = {
  id: string;
  inputSource: File | string;
  proxySource?: File | string;
};

type SendToWorkerAndWaitCallBack = (
  data: MainToWorkerMessage,
) => Promise<WorkerToMainMessage>;

export class CoreManager {
  private _engine: EngineCoordinator;

  private _sendToWorkerAndWait: SendToWorkerAndWaitCallBack;

  constructor(
    engine: EngineCoordinator,
    sendToWorkerAndWait: SendToWorkerAndWaitCallBack,
  ) {
    this._engine = engine;
    this._sendToWorkerAndWait = sendToWorkerAndWait.bind(engine);
  }

  public async addVideoSource({
    id,
    inputSource,
    proxySource,
  }: AddVideoSourceParams) {
    if (!this._engine.isInit) {
      throw new Error("Please init the engine first!");
    }
    const response = await this._sendToWorkerAndWait({
      type: "ADD_VIDEO_SOURCE",
      id: id,
      inputSource: inputSource,
      proxySource: proxySource,
    });

    if (response.type === "FINISH_ADD_VIDEO_SOURCE") {
      return response.data!;
    } else {
      throw new Error("Something went wrong to worker!");
    }
  }

  public async addVideoTrack({ id }: { id: string }) {
    if (!this._engine.isInit) {
      throw new Error("Please init the engine first!");
    }
    const response = await this._sendToWorkerAndWait({
      type: "ADD_VIDEO_TRACK",
      id: id,
    });

    if (response.type === "FINISH_ADD_VIDEO_TRACK") {
      return Object.freeze(response.data!);
    } else {
      throw new Error("Something went wrong to worker!");
    }
  }

  public async addVideoClip({
    id,
    trackId,
    sourceId,
    start,
    sourceStart,
    duration,
    property,
  }: {
    id: string;
    trackId: string;
    sourceId: string;
    start: number;
    sourceStart: number;
    duration: number;
    property?: Partial<MediaClipProperty>;
  }) {
    if (!this._engine.isInit) {
      throw new Error("Please init the engine first!");
    }
    const response = await this._sendToWorkerAndWait({
      type: "ADD_VIDEO_CLIP",
      id: id,
      trackId: trackId,
      sourceId: sourceId,
      start: start,
      sourceStart: sourceStart,
      duration: duration,
      property: property,
    });

    if (response.type === "FINISH_ADD_VIDEO_CLIP") {
      return Object.freeze(response.data!);
    } else {
      throw new Error("Something went wrong to worker!");
    }
  }

  //   public async clear({includeSources}: {includeSources?: boolean}) {

  //   }
}
