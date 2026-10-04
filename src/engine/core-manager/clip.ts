import { WrappedCanvas } from "mediabunny";
import { sourceManager } from "../workers/manager/source-manager";
import { masterTimeline } from "../workers/manager/animation-manager";
import { app } from "../workers/canvas";
import { gsap } from "gsap";

export interface MediaClipProperty {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
}

export type Keyframe<T = MediaClipProperty> = {
  [K in keyof T]: {
    key: K;
    frames: {
      time: number;
      value: T[K];
    }[];
  };
}[keyof T];

export interface VideoClipPreview {
  id: string;
}

export class VideoClipWorker {
  private _id: string;
  private _sourceId: string;
  private _sourceStart: number = 0;
  private _start: number = 0;
  private _duration: number = 0;
  private _property: Partial<MediaClipProperty> = {};
  private _iterator: AsyncIterator<WrappedCanvas> | null = null;
  private _timeline: gsap.core.Timeline;

  constructor(id: string, sourceId: string) {
    this._id = id;
    this._sourceId = sourceId;
    const screen = app!.screen;
    this._property = {
      x: screen.width / 2,
      y: screen.height / 2,
      scaleX: 1,
      scaleY: 1,
      anchorX: 0.5,
      anchorY: 0.5,
    };
    this._timeline = gsap.timeline({ paused: false });
    masterTimeline.add(this._timeline, this._start);
  }

  public rebuild() {
    if (!this._timeline) {
      return;
    }
    this._timeline.clear();
    this._timeline.startTime(this._start);
    this._timeline.set(this._property, this._property, 0);
    this._timeline.fromTo(
      this._property,
      this._property,
      { scaleX: 2, scaleY: 2, duration: 0.4 },
      2,
    );
  }

  public load(startSourceTime: number) {
    void this._iterator?.return?.();
    const source = sourceManager.getVideoSource(this._sourceId);
    if (!source) {
      throw new Error("Not found source");
    }
    const end = this._sourceStart + this._duration;
    this._iterator = (source.proxyVidSink ?? source.vidSink).canvases(
      Math.min(startSourceTime, end),
      end,
    );
  }

  public seek(startSourceTime: number) {}

  public async clear() {
    await this._iterator?.return?.();
    this._timeline.clear();
  }

  public get id() {
    return this._id;
  }

  public get sourceId() {
    return this._sourceId;
  }

  public get sourceStart(): number {
    return this._sourceStart;
  }

  public set sourceStart(value: number) {
    this._sourceStart = value;
  }

  public get start(): number {
    return this._start;
  }

  public set start(value: number) {
    this._start = value;
  }

  public get duration(): number {
    return this._duration;
  }

  public set duration(value: number) {
    this._duration = value;
  }

  public get iterator() {
    return this._iterator;
  }

  public getProperty<T extends keyof typeof this._property>(e: T) {
    return this._property[e];
  }

  public setProperty<T extends keyof typeof this._property>(
    e: T,
    value: MediaClipProperty[T],
  ) {
    this._property[e] = value;
  }
}

export interface VideoClip {
  id: string;
  sourceId: string;
  start: number;
  sourceStart: number;
  duration: number;
  property: MediaClipProperty;
  keyframes: Keyframe[];
}
