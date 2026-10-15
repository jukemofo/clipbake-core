export type Id = string;

/**
 * Mọi mốc thời gian / độ dài trong state đều là **microsecond, số nguyên**
 * (khớp expect.md và WebCodecs `timestamp`). Không dùng giây dạng float trong
 * state để tránh sai số khi cộng dồn / so sánh biên clip.
 * Chỉ đổi sang giây ở biên với mediabunny / AudioContext.
 */
export type Microseconds = number;

export type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;
