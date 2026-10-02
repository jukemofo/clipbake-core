import { v4 as uuid } from "uuid";

class Clip {
  protected _id: string;
  protected _start: number = 0;
  protected _sourceStart: number = 0;
  protected _sourceEnd: number = 0;

  constructor() {
    this._id = uuid();
  }

  public get sourceStart(): number {
    return this._sourceStart;
  }
  public set sourceStart(value: number) {
    this._sourceStart = value;
  }
  protected get sourceEnd(): number {
    return this._sourceEnd;
  }
  protected set sourceEnd(value: number) {
    this._sourceEnd = value;
  }
  public get start(): number {
    return this._start;
  }
  public set start(value: number) {
    this._start = value;
  }
  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }
}

type ClipOptionsType = {
  start?: number;
  sourceStart?: number;
  sourceEnd?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  x?: number;
  y?: number;
};

export class VideoClip extends Clip {
  private _source: any;

  constructor(source: any, options?: ClipOptionsType) {
    super();
    this._source = source;
    // get default time of source
    this._start = options?.start ?? 0;
    this._sourceEnd = options?.sourceEnd ?? 0;
    this._sourceStart = options?.sourceStart ?? 0;
  }

  public get source(): any {
    return this._source;
  }
}

export const coreManager = {
  VideoClip: VideoClip,
};
