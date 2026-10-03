import { CanvasSink, WrappedCanvas } from "mediabunny";
import { VideoClipWorker } from "./clip";
import {
  BUFFER_THRESHOLD_SIZE,
  MIN_BUFFER_SIZE,
  POOL_SIZE,
} from "../workers/constant";
import { sourceManager } from "../workers/manager/source-manager";
import { CanvasSource, Sprite, Texture } from "pixi.js";
import { app } from "../workers/canvas";
import { tl } from "../workers/manager/animation-manager";

export interface VideoTrackPreview {
  id: string;
}

const GAP = 0.5;

export class VideoTrackWorker {
  private _id: string;
  private _muted: boolean = false;
  private _visible: boolean = false;
  private _clipWorkers: Map<string, VideoClipWorker> = new Map();
  private _clipOrders: string[] = [];
  private _queue: WrappedCanvas[] = [];
  private _currentFrame: WrappedCanvas | null | undefined = null;
  private _duration: number = 0;
  private _currentClip: VideoClipWorker | null = null;
  private _isFetching: boolean = false;
  private _isBuffering: boolean = false;
  private _isEndOfClip: boolean = false;
  private _sprite: Sprite;
  private _texture: Texture;
  private _textureCanvas: OffscreenCanvas;

  constructor(id: string) {
    this._id = id;
    this._textureCanvas = new OffscreenCanvas(200, 200);
    this._texture = new Texture({
      source: new CanvasSource({ resource: this._textureCanvas }),
    });
    this._texture.dynamic = true;
    this._sprite = new Sprite(this._texture);
    // TODO: fix this
    tl.to(this._sprite, { x: 10, duration: 5 }, 2);

    app!.stage.addChild(this._sprite);
  }

  public get id(): string {
    return this._id;
  }

  public async addClip(clip: VideoClipWorker) {
    this._clipWorkers.set(clip.id, clip);

    let sortedClips = Array.from(this._clipWorkers.values()).sort(
      (a, b) => a.start - b.start,
    );

    for (let i = 1; i < sortedClips.length; i++) {
      let prevClip = sortedClips[i - 1];
      let currentClip = sortedClips[i];

      let prevEnd = prevClip.start + prevClip.duration;

      if (currentClip.start < prevEnd) {
        currentClip.start = prevEnd;

        this._clipWorkers.set(currentClip.id, currentClip);
      }
    }

    this._clipOrders = sortedClips.map((c) => c.id);
    // load here
  }

  public isStarving() {
    if (!this._currentClip) {
      return false;
    }
    if (this._isEndOfClip) return false;
    if (this._queue.length < MIN_BUFFER_SIZE) {
      return true;
    }
    return false;
  }

  public async renderAt(currentTime: number) {
    let currentClip = null;
    for (const id of this._clipOrders) {
      const clip = this._clipWorkers.get(id);
      if (
        clip &&
        clip.start <= currentTime &&
        currentTime < clip.start + clip.duration
      ) {
        currentClip = clip;
        break;
      }
    }

    if (!currentClip) {
      this._currentClip = null;
      const ctx = this._textureCanvas.getContext("2d");
      ctx?.clearRect(
        0,
        0,
        this._textureCanvas.width,
        this._textureCanvas.height,
      );
      this._texture.source.update();
      this._isEndOfClip = false;

      return;
    }

    const elapsed = currentTime - currentClip.start;
    const currentSourceTime = currentClip.sourceStart + elapsed;

    if (this._currentClip?.id !== currentClip.id) {
      this._currentClip?.clear?.();
      this._currentClip = currentClip;
      this._currentClip.load(currentSourceTime);
      this._isEndOfClip = false;
      this._sprite.scale.set(1, 1);
      this._sprite.anchor.set(0.5, 0.5);
      this._sprite.x = this._currentClip.property.x!;
      this._sprite.y = this._currentClip.property.y!;
    }

    if (this._queue.length <= 0) {
      this._fillBuffer();
      return;
    }

    let latestValidFrame = null;

    while (
      this._queue.length > 0 &&
      currentSourceTime >= this._queue[0].timestamp
    ) {
      latestValidFrame = this._queue.shift();
      this._fillBuffer();
    }

    if (latestValidFrame) {
      const canvas = latestValidFrame.canvas;

      if (canvas) {
        this._sprite.texture = this._texture;
        this._texture.source.resource = canvas;
        this._texture.source.resize(canvas.width, canvas.height);
        this._texture.source.update();
      } else {
        this._sprite.texture = Texture.EMPTY;
      }
    }

    // while (
    //   this._queue.length > 0 &&
    //   currentSourceTime >= this._queue[0].timestamp
    // ) {
    //   this._sprite.scale.set(1, 1);
    //   const canvas = this._queue.shift()?.canvas;
    //   this._fillBuffer();
    //   const width = canvas?.width ?? this._textureCanvas.width;
    //   const height = canvas?.height ?? this._textureCanvas.height;
    //   this._textureCanvas.width = width;
    //   this._textureCanvas.height = height;

    //   this._sprite.anchor.x = 0.5;
    //   this._sprite.anchor.y = 0.5;
    //   this._sprite.x = this._currentClip.property.x!;
    //   this._sprite.y = this._currentClip.property.y!;
    //   const ctx = this._textureCanvas.getContext("2d");
    //   if (canvas) {
    //     ctx?.drawImage(
    //       canvas,
    //       0,
    //       0,
    //       this._textureCanvas.width,
    //       this._textureCanvas.height,
    //     );
    //   } else {
    //     ctx?.clearRect(0, 0, this._sprite.width, this._sprite.height);
    //   }
    //   this._texture.source.update();

    //   this._texture.update();
    // }
  }

  private async _fillBuffer() {
    const iterator = this._currentClip?.iterator;
    if (this._isFetching || !iterator) return;
    this._isFetching = true;

    while (this._queue.length < POOL_SIZE && iterator) {
      const result = await iterator.next();
      if (result.done || !result.value) {
        this._isEndOfClip = true;
        break;
      }

      this._queue.push(result.value);
      if (this._isBuffering && this._queue.length >= BUFFER_THRESHOLD_SIZE) {
        this._isBuffering = false;
      }
    }

    this._isFetching = false;
  }

  public async clear() {
    await this._currentClip?.clear?.();
    this._currentClip = null;
    this._queue = [];
    this._isEndOfClip = false;
    if (this._texture) {
      this._texture.source.resource = Texture.EMPTY;
      this._texture.source.update();
    }
  }
}
