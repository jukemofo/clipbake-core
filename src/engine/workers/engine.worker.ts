import { addVideoClip } from "./handle-case/add-video-clip";
import { addVideoSource } from "./handle-case/add-video-source";
import { addVideoTrack } from "./handle-case/add-video-track";
import { initCanvas } from "./handle-case/init-canvas";
import { PlaybackController } from "./render/playback-controller";
import { WrappedMainToWorkerMessage } from "./types";
import { sendToMain } from "./util";

import { masterTimeline } from "./manager/animation-manager";
import { trackManager } from "./manager/track-manager";

let taskQueue = Promise.resolve();

let isWaitingBuffer = false;
let bufferCheckInterval: any = null;

function checkBuffering() {
  const isStarving = trackManager.isStarving();
  if (isStarving) {
    if (!isWaitingBuffer) {
      isWaitingBuffer = true;

      sendToMain({
        requestId: "buffer-wait-id",
        status: "success",
        type: "BUFFER_WAIT",
      });

      bufferCheckInterval = setInterval(() => {
        if (!trackManager.isStarving()) {
          clearInterval(bufferCheckInterval);
          bufferCheckInterval = null;
          isWaitingBuffer = false;

          sendToMain({
            requestId: "buffer-resolved-id",
            status: "success",
            type: "BUFFER_RESOLVED",
          });
        }
      }, 100);
    }

    return true;
  }

  return false;
}

const playbackController = new PlaybackController({
  onTick: (currentTime: number) => {
    const isBuffer = checkBuffering();
    if (isBuffer) {
      return;
    }
    masterTimeline.seek(currentTime);
    trackManager.renderAt(currentTime);
  },
  onSeek: (targetTime: number, highQuality: boolean) => {
    masterTimeline.seek(targetTime);
    if (highQuality) {
      trackManager.seek(targetTime);
    } else {
      trackManager.scrub(targetTime);
    }
  },
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
        if (playbackController.isPlaying) {
          playbackController.pause(seekedTime, true);
        }
        await playbackController.seek(seekedTime, highQuality);
        if (highQuality) {
          sendToMain({
            type: "SEEK_RESOLVED",
            time: seekedTime,
            status: "success",
            requestId,
          });
        }
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
