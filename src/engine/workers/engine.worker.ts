import { app, init } from "./canvas";
import { SourceManager, sourceManager } from "./data-manager/source-manager";
import { PlaybackController } from "./render/playback-controller";
import { WrappedMainToWorkerMessage } from "./types";
import { sendToMain } from "./util";

import { Text, TextStyle } from "pixi.js";

let taskQueue = Promise.resolve();

const playbackController = new PlaybackController((currentTime: number) => {});

self.onmessage = (e: MessageEvent<WrappedMainToWorkerMessage>) => {
  taskQueue.then(async () => {
    const msg = e.data;
    const requestId = msg.requestId;

    switch (msg.type) {
      case "INIT":
        const {
          canvas,
          width: initWidth,
          height: initHeight,
          backgroundColor,
        } = msg;
        await init(canvas, {
          width: initWidth,
          height: initHeight,
          backgroundColor: backgroundColor,
        });

        const style = new TextStyle({
          fontFamily: "Arial",
          fontSize: 150,
          fontWeight: "bold",
          fill: "#ffffff", // Chữ màu trắng
          dropShadow: {
            color: "#000000",
            blur: 4,
            angle: Math.PI / 6,
            distance: 6,
          },
        });

        const textSample = new Text({
          text: "Hello PixiJS v8!",
          style: style,
        });
        textSample.anchor.set(0.5);
        textSample.x = app!.screen.width / 2;
        textSample.y = app!.screen.height / 2;
        app!.stage.addChild(textSample);
        sendToMain({ type: "INIT_COMPLETED", requestId });
        break;
      case "PLAY":
        console.log(sourceManager.totalSources);
        const { startTime, basePerfTime } = msg;
        playbackController.play(startTime, basePerfTime);
        break;
      case "PAUSE":
        const { time: pausedTime } = msg;
        playbackController.pause(pausedTime);
        break;
      case "SEEK":
        const { time: seekedTime, highQuality } = msg;
        sendToMain({ type: "SEEK_RESOLVED", time: seekedTime, requestId });
        break;
      case "RESIZE":
        const { width: resizeWidth, height: resizeHeight } = msg;
        break;
      case "SOURCE_VIDEO_ADD":
        try {
          const source = await sourceManager.fromVideoSource(msg);

          sendToMain({
            type: "SOURCE_VIDEO_ADD_FINISHED",
            status: "success",
            data: SourceManager.toVideoSourcePreview(source),
            requestId,
          });
        } catch (e) {
          let message = "Something went wrong!";
          if (e instanceof Error) {
            message = e.message;
          }
          sendToMain({
            type: "SOURCE_VIDEO_ADD_FINISHED",
            status: "failed",
            errorMsg: message,
            requestId,
          });
        }
        break;
    }
  });
};
