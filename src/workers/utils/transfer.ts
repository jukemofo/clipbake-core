import { TRANSFER, WithTransfer } from "../client/type";

export function withTransfer(data: any, transfer: any[]) {
  if (!data || (typeof data !== "object" && typeof data !== "function")) {
    return data;
  }

  (data as any)[TRANSFER] = transfer;
  return data;
}

export function popTransfer(data: any) {
  const transfer = data?.[TRANSFER] ?? [];
  delete data?.[TRANSFER];
  return transfer;
}
