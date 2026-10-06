import { AudioBufferSink } from "mediabunny";
import { EngineCoordinator } from "..";
import { masterClock } from "../master-clock";
import { MainToWorkerMessage, WorkerToMainMessage } from "../workers/types";
import { AudioClip, AudioClipProperty, MediaClipProperty } from "./clip";
import { AudioTrack, VideoTrack } from "./track";
import {
  SourceManager,
  sourceManager,
} from "../workers/manager/source-manager";
import { playbackMachine } from "../playback-state-machine";

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
  private _audioTracks: Map<string, AudioTrack> = new Map();
  private _tracksOrder: string[] = [];
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

  public async addAudioSource({
    id,
    inputSource,
    proxySource,
  }: AddVideoSourceParams) {
    if (!this._engine.isInit) {
      throw new Error("Please init the engine first!");
    }
    const audioSourceMainThread = await sourceManager.addAudioSourceMainThread({
      id,
      inputSource,
      proxySource,
    });
    return SourceManager.toAudioSourceRaw(audioSourceMainThread);
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
      this._tracksOrder.push(id);
      return result;
    } else {
      throw new Error("Something went wrong to worker!");
    }
  }

  public async addAudioTrack({ id }: { id: string }) {
    if (!this._engine.isInit) {
      throw new Error("Please init the engine first!");
    }
    const track: AudioTrack = { id: id, clips: [], type: "audio" };
    this._audioTracks.set(track.id, track);
    this._tracksOrder.push(id);
    return track;
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
    if (playbackMachine.currentState === "PLAYING") {
      playbackMachine.send("PAUSE");
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
      const videoClips = response.data!;
      track.clips = videoClips;
      track.clips.sort((a, b) => a.start - b.start);

      this._engine.pub("playback:duration-update", this.duration);
      return track.clips.find((c) => c.id === id);
    } else {
      throw new Error("Something went wrong to worker!");
    }
  }

  public async addAudioClip({
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
    property?: Partial<AudioClipProperty>;
  }) {
    if (!this._engine.isInit) {
      throw new Error("Please init the engine first!");
    }
    if (playbackMachine.currentState === "PLAYING") {
      playbackMachine.send("PAUSE");
    }
    const clip: AudioClip = {
      id: id,
      sourceId: sourceId,
      start: start,
      sourceStart: sourceStart,
      duration: duration,
      property: { volume: 1, ...(property ?? {}) },
    };

    const track = this._audioTracks.get(trackId);
    if (!track) {
      throw new Error("Not found track!");
    }
    if (!sourceManager.getAudioSource(sourceId)) {
      throw new Error("Source not found!");
    }
    track.clips.push(clip);
    track.clips.sort((a, b) => a.start - b.start);
    this._rebuildClipStart(track);

    this._engine.pub("playback:duration-update", this.duration);
    return clip;
  }

  public get duration() {
    this._duration = 0;
    for (const track of [
      ...this._videoTracks.values(),
      ...this._audioTracks.values(),
    ]) {
      const clip = track.clips.at(-1);
      if (!clip) continue;

      this._duration = Math.max(this._duration, clip.duration + clip.start);
    }
    return this._duration;
  }

  public get videoTracks() {
    return Object.freeze(this._videoTracks);
  }

  public get audioTracks() {
    return Object.freeze(this._audioTracks);
  }

  private _rebuildClipStart(track: VideoTrack | AudioTrack) {
    for (let i = 1; i < track.clips.length; i++) {
      let prevClip = track.clips[i - 1];
      let currentClip = track.clips[i];

      let prevEnd = prevClip.start + prevClip.duration;

      if (currentClip.start < prevEnd) {
        currentClip.start = prevEnd;
      }
    }
  }

  public async close() {
    this._videoTracks.clear();
  }
}
