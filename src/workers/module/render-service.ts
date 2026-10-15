import { Application, DOMAdapter, WebWorkerAdapter } from "pixi.js";
import { Settings } from "../../types/settings";
import { AnyTrack } from "../../types/track";
import { AnyClip } from "../../types/clip";
import { Second } from "../../types/time";
import { gsap } from "gsap";

DOMAdapter.set(WebWorkerAdapter);

export let app: Application | null = null;

export class RenderService {
  private _app: Application;
  private _isInit: boolean;
  private _masterTimelineAnim = gsap.timeline({ paused: true });

  constructor() {
    this._app = new Application();
    this._isInit = false;
  }

  public async init(canvas: OffscreenCanvas, settings: Settings) {
    await this._app.init({
      canvas: canvas,
      width: settings.width,
      height: settings.height,
      background: settings.backgroundColor,
    });
    this._isInit = true;
  }

  public async render(currentTime: Second) {
    this._masterTimelineAnim.seek(currentTime);
  }

  public async addTrack(track: AnyTrack, order: number) {}

  public async updateTrackClips(clips: AnyClip[]) {}
}
