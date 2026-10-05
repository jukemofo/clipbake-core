import { CanvasSource, Sprite, Texture } from "pixi.js";
import { app } from "../canvas";
import { VideoClipRender } from "./video-clip-render";

export class VideoTrackRender {
  private _id: string;
  private _clips: VideoClipRender[] = [];
  private _textureA: Texture;
  private _textureB: Texture;
  private _spriteA: Sprite;
  private _spriteB: Sprite;
  private _activeSpriteLabel: "A" | "B";
  private _currentClip: VideoClipRender | null = null;
  private _sessionId: number = 0;

  constructor(id: string) {
    this._id = id;

    this._activeSpriteLabel = "A";
    this._textureA = new Texture({
      source: new CanvasSource({ resource: new OffscreenCanvas(200, 200) }),
    });
    this._spriteA = new Sprite(this._textureA);
    this._textureA.dynamic = true;
    app!.stage.addChild(this._spriteA);

    this._textureB = new Texture({
      source: new CanvasSource({ resource: new OffscreenCanvas(200, 200) }),
    });
    this._spriteB = new Sprite(this._textureB);
    this._textureB.dynamic = true;
    app!.stage.addChild(this._spriteB);
  }

  public addClip(clip: VideoClipRender) {
    this._clips.push(clip);
    this._clips.sort((a, b) => a.start - b.start);

    for (let i = 1; i < this._clips.length; i++) {
      let prevClip = this._clips[i - 1];
      let currentClip = this._clips[i];

      let prevEnd = prevClip.start + prevClip.duration;

      if (currentClip.start < prevEnd) {
        currentClip.start = prevEnd;
      }
    }
  }

  public async renderAt(currentTime: number) {
    const clip = this._findCurrentClip(currentTime);
    const nextClip = this._findNearestClip(currentTime);
    let activeSprite = this._getActiveSprite();
    if (!clip) {
      activeSprite.texture = Texture.EMPTY;
      return;
    }

    if (nextClip && nextClip.id !== clip.id) {
      nextClip.prepare();
    }

    if (!this._currentClip) {
      this._currentClip = clip;
    }

    const wrapped = await clip.getFrame(currentTime);
    if (this._currentClip.id !== clip.id) {
      this._currentClip?.close();
      activeSprite.texture = Texture.EMPTY;
      activeSprite.zIndex = 0;
      this._activeSpriteLabel = this._activeSpriteLabel === "A" ? "B" : "A";
      activeSprite = this._getActiveSprite();
      activeSprite.zIndex = 1;
      this._currentClip = clip;
    }

    if (wrapped) {
      const canvas = wrapped.canvas;
      const texture =
        this._activeSpriteLabel === "A" ? this._textureA : this._textureB;
      texture.source.resource = canvas;
      activeSprite.texture = texture;
      texture.source.update();
    }

    this._renderProperty(activeSprite);
  }

  public async seek(currentTime: number, highQuality: boolean) {
    this._sessionId += 1;
    const currentSession = this._sessionId;
    this._currentClip?.close();
    const clip = this._findCurrentClip(currentTime);
    const nextClip = this._findNearestClip(currentTime);

    this._currentClip = clip;

    if (nextClip && nextClip.id !== clip?.id) {
      nextClip.prepare();
    }

    if (!clip) {
      return;
    }

    await clip.seek(currentTime);
    const wrapped = await clip.getFrame(currentTime);
    if (currentSession !== this._sessionId) {
      return;
    }
    this._activeSpriteLabel = "A";
    this._spriteA.texture = Texture.EMPTY;
    this._spriteB.texture = Texture.EMPTY;
    if (wrapped) {
      this._textureA.source.resource = wrapped.canvas;
      this._spriteA.texture = this._textureA;
      this._textureA.source.update();
    }
    this._renderProperty(this._spriteA);
  }

  private _findCurrentClip(currentTime: number) {
    let currentClip = null;
    for (const clip of this._clips) {
      if (
        clip &&
        clip.start <= currentTime &&
        currentTime < clip.start + clip.duration
      ) {
        currentClip = clip;
        break;
      }
    }
    return currentClip;
  }

  private _findNearestClip(currentTime: number) {
    let currentClip = null;
    for (const clip of this._clips) {
      if (clip.start > currentTime) {
        currentClip = clip;
        break;
      }
    }
    return currentClip;
  }

  private _getActiveSprite() {
    return this._activeSpriteLabel === "A" ? this._spriteA : this._spriteB;
  }

  private _renderProperty(sprite: Sprite) {
    sprite.scale.set(1, 1);
    sprite.position.set(app!.screen.width / 2, app!.screen.height / 2);
    sprite.anchor.set(0.5, 0.5);
  }

  public isStarving() {
    return this._currentClip?.isStarving();
  }

  public isClipExisted(id: string) {
    return this._clips.find((c) => c.id === id);
  }

  public get id() {
    return this._id;
  }
}
