import { TrackManager, trackManager } from "../manager/track-manager";
import { AddVideoClipMessage } from "../types";
import { sendToMain } from "../util";
import { VideoClipWorker } from "../../core-manager/clip";

export async function addVideoClip(
  msg: AddVideoClipMessage,
  requestId: string,
) {
  try {
    const { trackId, type, ...rest } = msg;
    const clip = new VideoClipWorker(rest.id, rest.sourceId);
    clip.sourceStart = rest.sourceStart;
    clip.start = rest.start;
    clip.duration = rest.duration;
    await trackManager.addVideoClip(clip, trackId);
    sendToMain({
      type: "FINISH_ADD_VIDEO_CLIP",
      status: "success",
      data: TrackManager.toVideoClipPreview(clip),
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
