import { SourceManager, sourceManager } from "../manager/source-manager";
import { AddVideoSourceMessage } from "../types";
import { sendToMain } from "../util";

export async function addVideoSource(
  msg: AddVideoSourceMessage,
  requestId: string,
) {
  try {
    const source = await sourceManager.addVideoSource(msg);
    sendToMain({
      type: "FINISH_ADD_VIDEO_SOURCE",
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
      type: "FINISH_ADD_VIDEO_SOURCE",
      status: "failed",
      errorMsg: message,
      requestId,
    });
  }
}
