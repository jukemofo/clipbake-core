import { app, init } from "./canvas";
import { SourceManager, sourceManager } from "./manager/source-manager";
import { addVideoClip } from "./handle-case/add-video-clip";
import { addVideoSource } from "./handle-case/add-video-source";
import { addVideoTrack } from "./handle-case/add-video-track";
import { initCanvas } from "./handle-case/init-canvas";
import { PlaybackController } from "./render/playback-controller";
import { WrappedMainToWorkerMessage } from "./types";
import { sendToMain } from "./util";

import { Text, TextStyle } from "pixi.js";
import { trackManager } from "./manager/track-manager";

let taskQueue = Promise.resolve();

const playbackController = new PlaybackController((currentTime: number) => {
  trackManager.renderAt(currentTime);
});

self.onmessage = (e: MessageEvent<WrappedMainToWorkerMessage>) => {
  taskQueue.then(async () => {
    const { requestId, ...restMessage } = e.data;

    switch (restMessage.type) {
      case "INIT":
        await initCanvas(restMessage, requestId);
        break;
      case "PLAY":
        const { startTime, basePerfTime } = restMessage;
        playbackController.play(startTime, basePerfTime);
        break;
      case "PAUSE":
        const { time: pausedTime } = restMessage;
        playbackController.pause(pausedTime);
        break;
      case "SEEK":
        const { time: seekedTime, highQuality } = restMessage;
        sendToMain({
          type: "SEEK_RESOLVED",
          time: seekedTime,
          status: "success",
          requestId,
        });
        break;
      case "RESIZE":
        const { width: resizeWidth, height: resizeHeight } = restMessage;
        break;
      case "ADD_VIDEO_SOURCE":
        await addVideoSource(restMessage, requestId);
        break;
      case "ADD_VIDEO_TRACK":
        await addVideoTrack(restMessage, requestId);
        break;
      case "ADD_VIDEO_CLIP":
        await addVideoClip(restMessage, requestId);
        break;
    }
  });
};
