import { trackManagerV2 } from "../manager/track-manager-v2";
import { AddVideoTrackMessage } from "../types";
import { sendToMain } from "../util";

export async function addVideoTrack(
  msg: AddVideoTrackMessage,
  requestId: string,
) {
  try {
    const { id } = msg;
    const track = trackManagerV2.addVideoTrack(id);
    sendToMain({
      type: "FINISH_ADD_VIDEO_TRACK",
      status: "success",
      data: { id: track.id },
      requestId,
    });
  } catch (e) {
    let message = "Something went wrong!";
    if (e instanceof Error) {
      message = e.message;
    }
    sendToMain({
      type: "FINISH_ADD_VIDEO_TRACK",
      status: "failed",
      errorMsg: message,
      requestId,
    });
  }
}
