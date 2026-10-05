import { AudioBufferSink } from "mediabunny";
import { EngineCoordinator } from "..";
import { masterClock } from "../master-clock";
import { MainToWorkerMessage, WorkerToMainMessage } from "../workers/types";
import { MediaClipProperty } from "./clip";
import { VideoTrack } from "./track";
import { sourceManager } from "../workers/manager/source-manager";

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
  private _videoTracks: Map<string, VideoTrack> = new Map();
  private _duration: number = 0;
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

    await sourceManager.addVideoSource({ id, inputSource, proxySource });

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
      const result = response.data!;
      this._videoTracks.set(id, result);
      return result;
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
      currentTime: masterClock.getCurrentTime(),
    });

    if (response.type === "FINISH_ADD_VIDEO_CLIP") {
      const track = this._videoTracks.get(trackId);
      if (!track) {
        throw new Error("Not found track!");
      }
      const videoClip = Object.freeze(response.data!);
      track.clips.push(videoClip);
      track.clips.sort((a, b) => a.start - b.start);

      this._engine.pub("playback:duration-update", this.duration);

      return videoClip;
    } else {
      throw new Error("Something went wrong to worker!");
    }
  }

  public get duration() {
    this._duration = 0;
    for (const track of this._videoTracks.values()) {
      const clip = track.clips.at(-1);
      if (!clip) continue;

      this._duration = Math.max(this._duration, clip.duration + clip.start);
    }
    return this._duration;
  }

  public get videoTracks() {
    return Object.freeze(this._videoTracks);
  }

  public async close({ includeSources }: { includeSources?: boolean }) {
    this._videoTracks.clear();
  }
}
