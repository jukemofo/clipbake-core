const engine = await createEngine({ canvas, fps: 30, width: 1920, height: 1080 });

// Source: async vì phải probe/decode metadata
const src = await engine.sources.add(file); // { id, duration, width, height }

// Track & Clip: sync, trả id ngay; worker xử lý nền
const v1 = engine.tracks.add({ kind: 'video' });
const c1 = engine.clips.add({ trackId: v1, sourceId: src.id, start: 0, in: 0, duration: src.duration });

engine.clips.update(c1, { start: 2_000_000 });
engine.clips.remove(c1);

// Gom nhiều thao tác = 1 message + 1 bước undo
engine.transaction(() => {
engine.clips.update(a, { start: 0 });
engine.clips.update(b, { start: 5_000_000 });
});

// Playback
engine.play(); engine.pause(); engine.seek(5_000_000);
engine.currentTime; // đọc từ SAB, luôn mới nhất

// Đọc state & subscribe
engine.getState(); // replica, readonly
const off = engine.subscribe(s => s.tracks, tracks => renderTimeline(tracks));
engine.on('ended', () => {});
engine.undo(); engine.redo();
engine.destroy();
