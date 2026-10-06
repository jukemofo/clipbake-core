type FitParams = {
  videoWidth: number;
  videoHeight: number;
  canvasWidth: number;
  canvasHeight: number;
};

export function fitContain({
  videoWidth,
  videoHeight,
  canvasWidth,
  canvasHeight,
}: FitParams) {
  const scaleX = canvasWidth / videoWidth;
  const scaleY = canvasHeight / videoHeight;

  const scale = Math.min(scaleX, scaleY);

  return {
    scaleX: scale,
    scaleY: scale,
    x: (canvasWidth - videoWidth * scale) / 2,
    y: (canvasHeight - videoHeight * scale) / 2,
  };
}

export function fitCover({
  videoWidth,
  videoHeight,
  canvasWidth,
  canvasHeight,
}: FitParams) {
  const scaleX = canvasWidth / videoWidth;
  const scaleY = canvasHeight / videoHeight;
  const scale = Math.max(scaleX, scaleY);

  return {
    scaleX: scale,
    scaleY: scale,
    x: (canvasWidth - videoWidth * scale) / 2,
    y: (canvasHeight - videoHeight * scale) / 2,
  };
}

/*

// Bước 1: Khởi tạo (Chỉ làm 1 lần duy nhất lúc tạo Sprite)
const baseTexture = mySprite.texture.baseTexture;
// Tạo một texture riêng cho sprite này để không ảnh hưởng sprite khác, 
// nhưng giữ nguyên kích thước gốc ban đầu
mySprite.texture = new PIXI.Texture(baseTexture, new PIXI.Rectangle(0, 0, baseTexture.width, baseTexture.height));

// ----------------------------------------------------

// Bước 2: Hàm cập nhật crop realtime (Gọi trong Ticker / Animation Loop)
function updateCropRealtime(sprite, left, top, right, bottom) {
    const baseW = sprite.texture.baseTexture.width;
    const baseH = sprite.texture.baseTexture.height;

    // Tính toán lại kích thước pixel mới
    const x = left;
    const y = top;
    const cropW = Math.max(1, baseW - left - right);   // Tránh width <= 0 gây lỗi
    const cropH = Math.max(1, baseH - top - bottom); // Tránh height <= 0 gây lỗi

    // Thay đổi TRỰC TIẾP các thuộc tính của frame có sẵn, KHÔNG tạo mới đối tượng
    const frame = sprite.texture.frame;
    frame.x = x;
    frame.y = y;
    frame.width = cropW;
    frame.height = cropH;

    // Ép PixiJS tính toán lại tọa độ hiển thị ngay lập tức
    sprite.texture.updateUvs();
}


*/
