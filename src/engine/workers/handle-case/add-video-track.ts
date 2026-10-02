import { TrackDataManager, trackDataManager } from "../manager/track-manager";
import { AddVideoTrackMessage } from "../types";
import { sendToMain } from "../util";

export async function addVideoTrack(
  msg: AddVideoTrackMessage,
  requestId: string,
) {
  try {
    const { id } = msg;
    const track = trackDataManager.addVideoTrack(id);
    sendToMain({
      type: "FINISH_ADD_VIDEO_TRACK",
      status: "success",
      data: TrackDataManager.toVideoTrackPreview(track),
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
