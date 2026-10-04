import { addVideoClip } from "./handle-case/add-video-clip";
import { addVideoSource } from "./handle-case/add-video-source";
import { addVideoTrack } from "./handle-case/add-video-track";
import { initCanvas } from "./handle-case/init-canvas";
import { PlaybackController } from "./render/playback-controller";
import { WrappedMainToWorkerMessage } from "./types";
import { sendToMain } from "./util";

import { masterTimeline } from "./manager/animation-manager";
import { trackManagerV2 } from "./manager/track-manager-v2";

let taskQueue = Promise.resolve();

const playbackController = new PlaybackController(
  (currentTime: number) => {
    const isStarving = trackManagerV2.isStarving();
    masterTimeline.seek(currentTime);
    trackManagerV2.renderAt(currentTime);
  },
  (targetTime: number, highQuality: boolean) => {
    console.log("seek", targetTime);
    masterTimeline.seek(targetTime);
    trackManagerV2.seek(targetTime, highQuality);
  },
);

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
        playbackController.pause(seekedTime);
        await playbackController.seek(seekedTime, highQuality);
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
