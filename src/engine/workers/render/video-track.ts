// import { CanvasSink, WrappedCanvas } from "mediabunny";
// import * as PIXI from "pixi.js";

// export class VideoTrack {
//   private _sink: CanvasSink;
//   private _sprite: PIXI.Sprite;
//   private _texture: PIXI.Texture | null = null;

//   // Hàng đợi chứa tối đa 3 frame từ pool
//   private _queue: WrappedCanvas[] = [];
//   private _currentFrame: WrappedCanvas | null = null;

// private toSourceTime(timelineTime: number): number {
//     return (timelineTime - this.startTime) * this.speed + this.trimStart;
//   }

//   // Iterator để nạp tuần tự khi Play
//   private _iterator: AsyncIterator<WrappedCanvas> | null = null;
//   private _isBuffering = false;

//   constructor(sink: CanvasSink) {
//     this._sink = sink;
//     this._sprite = new PIXI.Sprite();
//   }

//   // 1. HÀM KHỞI TẠO BAN ĐẦU (Gọi 1 lần trước khi render)
//   public async init(stage: PIXI.Container) {
//     // Lấy frame đầu tiên tại giây 0 để khởi tạo Texture
//     const firstFrame = await this._sink.getCanvas(0);
//     this._currentFrame = firstFrame;

//     // Gắn vào Pixi (Ví dụ Pixi v8)
//     this._texture = PIXI.Texture.from(firstFrame.canvas);
//     this._sprite.texture = this._texture;

//     stage.addChild(this._sprite);
//   }

//   // 2. KHI BẮT ĐẦU PLAY (Khởi động nạp đệm ngầm)
//   public onPlay(startTime: number) {
//     // Xóa hàng đợi cũ
//     this._queue = [];
//     // Tạo luồng đọc tuần tự từ startTime
//     this._iterator = this._sink.canvases(startTime);
//     this._fillBuffer();
//   }

//   // Vòng lặp ngầm nạp đầy buffer (tối đa 3 frame)
//   private async _fillBuffer() {
//     if (this._isBuffering || !this._iterator) return;
//     this._isBuffering = true;

//     // Giữ cho queue luôn đầy (nhưng không vượt quá poolSize)
//     while (this._queue.length < 3 && this._iterator) {
//       const result = await this._iterator.next();
//       if (result.done || !result.value) break;

//       this._queue.push(result.value);
// if (this.isStarving && this._queue.length >= BUFFER_THRESHOLD) {
//         this.isStarving = false; // <-- GỠ CỜ NGHẼN TẠI ĐÂY!
//       }
//     }

//     this._isBuffering = false;
//   }

//   // 3. HÀM CHÍNH: renderAt ĐƯỢC GỌI MỖI TICK TRONG LOOP
//   public renderAt(currentTime: number) {
//     if (!this._texture) return;

//  if (this._queue.length < MIN_BUFFER_SIZE && !this._isEnded) {
//       this.isStarving = true; // <-- ĐÂY MỚI LÀ CHỖ KÍCH HOẠT BUFFER_WAIT!
//       this._fillBuffer();     // Hối thúc nạp nhanh lên
//       return;                 // Dừng vẽ vì đâu có frame mới nào
//     }

//     // Kiểm tra frame tiếp theo trong hàng đợi
//     // Nếu currentTime đã chạm hoặc vượt qua timestamp của frame kế tiếp:
//     while (this._queue.length > 0 && currentTime >= this._queue[0].timestamp) {
//       // Đẩy frame cũ đi, lấy frame mới
//       this._currentFrame = this._queue.shift()!;

//       // CẬP NHẬT PIXI TEXTURE VỚI CANVAS MỚI
//       // (Pixi v8)
//       this._texture.source.resource = this._currentFrame.canvas;
//       this._texture.source.update();

//       // (Hoặc nếu dùng Pixi v7: this._texture.update();)

//       // Kích hoạt nạp bù frame mới vào queue vì vừa trống 1 chỗ
//       this._fillBuffer();
//     }

//     // NẾU CHƯA TỚI GIỜ CỦA FRAME MỚI:
//     // Không làm gì cả! PixiSprite tự động giữ nguyên hình ảnh cũ.
//   }

//   // 4. KHI SEEK HOẶC SCRUB (Nhảy frame tức thì)
//   public async seekAt(targetTime: number) {
//     // Ngắt iterator tuần tự cũ
//     this._iterator = null;
//     this._queue = [];

//     // Nhảy thẳng đến timestamp lấy đúng 1 frame
//     const frame = await this._sink.getCanvas(targetTime);
//     this._currentFrame = frame;

//     // Cập nhật ngay lên Pixi
//     if (this._texture) {
//       this._texture.source.resource = frame.canvas;
//       this._texture.source.update();
//     }
//   }
// }
