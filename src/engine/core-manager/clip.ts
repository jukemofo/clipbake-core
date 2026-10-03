import { WrappedCanvas } from "mediabunny";
import { sourceManager } from "../workers/manager/source-manager";

export interface MediaClipProperty {
  width: number;
  height: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
}

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

  constructor(id: string, sourceId: string) {
    this._id = id;
    this._sourceId = sourceId;
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

  public async clear() {
    await this._iterator?.return?.();
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
}
