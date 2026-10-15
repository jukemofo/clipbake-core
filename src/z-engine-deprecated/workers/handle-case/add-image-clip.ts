import { ImageClip } from "../../core-manager/clip";
import { app } from "../canvas";
import { trackManager } from "../manager/track-manager";
import { AddImageClipMessage } from "../types";
import { sendToMain } from "../util";

export async function addImageClip(
  msg: AddImageClipMessage,
  requestId: string,
) {
  try {
    const { trackId, type, currentTime, ...rest } = msg;
    const screen = app!.screen;
    const clip: ImageClip = {
      id: rest.id,
      sourceId: rest.sourceId,
      start: rest.start,
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
    const responseClips = trackManager.addImageClip(clip, trackId);
    await trackManager.seek(currentTime);

    sendToMain({
      type: "FINISH_ADD_IMAGE_CLIP",
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
      type: "FINISH_ADD_IMAGE_CLIP",
      status: "failed",
      errorMsg: message,
      requestId,
    });
  }
}
