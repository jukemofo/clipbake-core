import { VideoClip } from "../../core-manager/clip";
import { app } from "../canvas";
import { trackManager } from "../manager/track-manager";
import { AddVideoClipMessage } from "../types";
import { sendToMain } from "../util";

export async function addVideoClip(
  msg: AddVideoClipMessage,
  requestId: string,
) {
  try {
    const { trackId, type, currentTime, ...rest } = msg;
    const screen = app!.screen;
    const clip: VideoClip = {
      id: rest.id,
      sourceId: rest.sourceId,
      start: rest.start,
      sourceStart: rest.sourceStart,
      duration: rest.duration,
      property: {
        x: screen.width / 2,
        y: screen.height / 2,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: 1,
        scaleY: 1,
        ...(rest.property ?? {}),
      },
      keyframes: [],
    };
    const responseClips = trackManager.addVideoClip(clip, trackId);
    await trackManager.seek(currentTime);

    sendToMain({
      type: "FINISH_ADD_VIDEO_CLIP",
      status: "success",
      data: responseClips,
      requestId,
    });
  } catch (e) {
    let message = "Something went wrong!";
    if (e instanceof Error) {
      message = e.message;
    }
    sendToMain({
      type: "FINISH_ADD_VIDEO_CLIP",
      status: "failed",
      errorMsg: message,
      requestId,
    });
  }
}
