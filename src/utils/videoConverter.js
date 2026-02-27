import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg = null;

async function getFFmpeg() {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg;

  ffmpeg = new FFmpeg();

  // Log ffmpeg messages for debugging
  ffmpeg.on('log', ({ message }) => {
    console.log('[ffmpeg]', message);
  });

  // Use toBlobURL to download files on main thread and create blob URLs.
  // This avoids Vite module-worker import() issues with files in public/.
  const baseURL = `${window.location.origin}/ffmpeg`;
  console.log('🔄 Loading ffmpeg-core from', baseURL);

  const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
  const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

  await ffmpeg.load({ coreURL, wasmURL });

  console.log('✅ ffmpeg-core loaded successfully');
  return ffmpeg;
}

/**
 * Convert a video Blob (e.g. WebM or fragmented MP4) to a standard MP4.
 * Uses ffmpeg.wasm — runs entirely in the browser.
 *
 * @param {Blob} videoBlob - The source video blob
 * @returns {Promise<Blob>} MP4 blob
 */
export async function convertToMp4(videoBlob) {
  console.log('🎬 convertToMp4 called, input:', videoBlob.type, videoBlob.size, 'bytes');

  const ff = await getFFmpeg();

  const inputExt = videoBlob.type?.includes('mp4') ? 'mp4' : 'webm';
  const inputName = `input.${inputExt}`;
  const outputName = 'output.mp4';

  await ff.writeFile(inputName, await fetchFile(videoBlob));

  const exitCode = await ff.exec([
    '-i', inputName,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '28',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    outputName,
  ]);

  if (exitCode !== 0) {
    console.error('❌ ffmpeg exited with code', exitCode);
    throw new Error(`ffmpeg conversion failed (exit code ${exitCode})`);
  }

  const data = await ff.readFile(outputName);
  console.log('✅ Conversion done, output size:', data.byteLength, 'bytes');

  // Clean up temp files
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  if (!data.byteLength) {
    throw new Error('ffmpeg produced an empty output file');
  }

  return new Blob([data.buffer], { type: 'video/mp4' });
}
