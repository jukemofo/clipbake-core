import { SourceManager, sourceManager } from "../manager/source-manager";
import { AddImageSourceMessage } from "../types";
import { sendToMain } from "../util";

export async function addImageSource(
  msg: AddImageSourceMessage,
  requestId: string,
) {
  try {
    const source = await sourceManager.addImageSource(msg);
    sendToMain({
      type: "FINISH_ADD_IMAGE_SOURCE",
      status: "success",
      data: SourceManager.toImageSourceRaw(source),
      requestId,
    });
  } catch (e) {
    let message = "Something went wrong!";
    if (e instanceof Error) {
      message = e.message;
    }
    sendToMain({
      type: "FINISH_ADD_IMAGE_SOURCE",
      status: "failed",
      errorMsg: message,
      requestId,
    });
  }
}
