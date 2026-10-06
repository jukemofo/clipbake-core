import { trackManager } from "../manager/track-manager";
import { AddImageTrackMessage } from "../types";
import { sendToMain } from "../util";

export async function addImageTrack(
  msg: AddImageTrackMessage,
  requestId: string,
) {
  try {
    const { id } = msg;
    const track = trackManager.addImageTrack(id);
    sendToMain({
      type: "FINISH_ADD_IMAGE_TRACK",
      status: "success",
      data: { id: track.id, clips: [], type: "image" },
      requestId,
    });
  } catch (e) {
    let message = "Something went wrong!";
    if (e instanceof Error) {
      message = e.message;
    }
    sendToMain({
      type: "FINISH_ADD_IMAGE_TRACK",
      status: "failed",
      errorMsg: message,
      requestId,
    });
  }
}
