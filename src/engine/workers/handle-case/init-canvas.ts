import { Text, TextStyle } from "pixi.js";
import { app, init } from "../canvas";
import { InitMessage } from "../types";
import { sendToMain } from "../util";

export async function initCanvas(msg: InitMessage, requestId: string) {
  const { canvas, width: initWidth, height: initHeight, backgroundColor } = msg;
  await init(canvas, {
    width: initWidth,
    height: initHeight,
    backgroundColor: backgroundColor,
  });

  // const style = new TextStyle({
  //   fontFamily: "Arial",
  //   fontSize: 150,
  //   fontWeight: "bold",
  //   fill: "#ffffff",
  //   dropShadow: {
  //     color: "#000000",
  //     blur: 4,
  //     angle: Math.PI / 6,
  //     distance: 6,
  //   },
  // });

  // const textSample = new Text({
  //   text: "Hello PixiJS v8!",
  //   style: style,
  // });
  // textSample.anchor.set(0.5);
  // textSample.x = app!.screen.width / 2;
  // textSample.y = app!.screen.height / 2;
  // app!.stage.addChild(textSample);
  sendToMain({ type: "INIT_COMPLETED", status: "success", requestId });
}
