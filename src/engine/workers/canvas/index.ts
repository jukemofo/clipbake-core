import { Application, DOMAdapter, WebWorkerAdapter } from "pixi.js";

DOMAdapter.set(WebWorkerAdapter);

export let app: Application | null = null;

type InitType = {
  width: number;
  height: number;
  backgroundColor: string;
};

export async function init(
  canvas: OffscreenCanvas,
  { width, height, backgroundColor }: InitType,
) {
  if (app) return;

  app = new Application();
  await app.init({
    canvas: canvas,
    width: width,
    height: height,
    background: backgroundColor ?? "#000000",
  });
}
