import { getFontEmbedCSS, toCanvas } from "html-to-image";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";

/** H.264 profiles to try, best first. X needs H.264 in an MP4 container. */
const AVC_CODECS = ["avc1.640033", "avc1.640028", "avc1.4d0033", "avc1.42003e"];

async function pickCodec(width: number, height: number, fps: number) {
  if (typeof VideoEncoder === "undefined") return null;
  for (const codec of AVC_CODECS) {
    const config: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate: 10_000_000,
      framerate: fps,
    };
    const { supported } = await VideoEncoder.isConfigSupported(config);
    if (supported) return config;
  }
  return null;
}

export function canEncodeMp4() {
  return typeof window !== "undefined" && typeof window.VideoEncoder !== "undefined";
}

/**
 * Renders a DOM node frame by frame and encodes the frames to an H.264 MP4.
 * `renderFrame` must update the node synchronously (e.g. with flushSync).
 */
export async function exportMp4({
  node,
  width,
  height,
  pixelRatio,
  fps,
  duration,
  renderFrame,
  onProgress,
}: {
  node: HTMLElement;
  width: number;
  height: number;
  pixelRatio: number;
  fps: number;
  duration: number;
  renderFrame: (time: number) => void;
  onProgress?: (fraction: number) => void;
}): Promise<Blob> {
  const outWidth = Math.round(width * pixelRatio);
  const outHeight = Math.round(height * pixelRatio);
  const config = await pickCodec(outWidth, outHeight, fps);
  if (!config) throw new Error("This browser can’t encode H.264 video.");

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: outWidth, height: outHeight, frameRate: fps },
    fastStart: "in-memory",
  });

  let encodeError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      encodeError = error;
    },
  });
  encoder.configure(config);

  await document.fonts.ready;
  const fontEmbedCSS = await getFontEmbedCSS(node);
  const frameCount = Math.round(duration * fps);
  const frameMicros = 1_000_000 / fps;

  for (let i = 0; i < frameCount; i++) {
    if (encodeError) throw encodeError;
    renderFrame(i / fps);
    const canvas = await toCanvas(node, {
      width,
      height,
      pixelRatio,
      canvasWidth: width,
      canvasHeight: height,
      fontEmbedCSS,
    });
    const frame = new VideoFrame(canvas, { timestamp: i * frameMicros, duration: frameMicros });
    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();

    while (encoder.encodeQueueSize > 8) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    onProgress?.((i + 1) / frameCount);
  }

  await encoder.flush();
  encoder.close();
  if (encodeError) throw encodeError;
  muxer.finalize();
  return new Blob([muxer.target.buffer], { type: "video/mp4" });
}
