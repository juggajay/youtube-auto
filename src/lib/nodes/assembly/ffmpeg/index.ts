import { spawn } from 'child_process';
import { writeFile as fsWriteFile, mkdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import type { TimelineSegment, AssemblyConfig, VisualSource } from '../types';
import { generateTextCard } from '../visuals/text-cards';
import { PexelsClient } from '../visuals/stock';

export interface RenderOptions {
  timeline: TimelineSegment[];
  config: AssemblyConfig;
  outputPath: string;
  workDir: string;
  credentials: {
    pexels?: string;
    gemini?: string;
  };
  onProgress?: (percent: number, message: string) => void;
}

export interface RenderResult {
  outputPath: string;
  duration: number;
  fileSize: number;
}

interface PreparedAsset {
  segmentId: string;
  visualIndex: number;
  type: 'video' | 'image' | 'audio';
  localPath: string;
  duration?: number;
}

/**
 * Render video using FFmpeg
 */
export async function renderVideo(options: RenderOptions): Promise<RenderResult> {
  const { timeline, config, outputPath, workDir, onProgress } = options;

  // Ensure work directory exists
  await mkdir(workDir, { recursive: true });

  // Step 1: Download/prepare all assets
  onProgress?.(5, 'Preparing assets...');
  const preparedAssets = await prepareAssets(timeline, workDir, options);

  // Step 2: Build FFmpeg filter complex
  onProgress?.(20, 'Building video filter...');
  const { filterComplex, inputFiles, hasAudio } = buildFilterComplex(timeline, preparedAssets, config);

  // Step 3: Build FFmpeg command
  const command = buildFfmpegCommand({
    inputs: inputFiles,
    filterComplex,
    config,
    outputPath,
    hasAudio,
    backgroundMusic: config.assets.backgroundMusic,
  });

  // Step 4: Execute FFmpeg
  onProgress?.(30, 'Rendering video...');
  const totalDuration = timeline.reduce((sum, seg) => sum + seg.duration, 0);

  await executeFfmpeg(command, totalDuration, (progress) => {
    // FFmpeg progress is 30-95%
    const mappedProgress = 30 + (progress * 0.65);
    onProgress?.(mappedProgress, `Rendering: ${Math.round(progress)}%`);
  });

  // Step 5: Get output info
  onProgress?.(95, 'Finalizing...');
  const fileStats = await stat(outputPath);

  return {
    outputPath,
    duration: totalDuration,
    fileSize: fileStats.size,
  };
}

async function prepareAssets(
  timeline: TimelineSegment[],
  workDir: string,
  options: RenderOptions
): Promise<PreparedAsset[]> {
  const assets: PreparedAsset[] = [];
  let assetIndex = 0;
  const totalAssets = timeline.reduce((sum, seg) =>
    sum + seg.visuals.length + (seg.audio ? 1 : 0), 0
  );

  const pexelsClient = options.credentials.pexels
    ? new PexelsClient(options.credentials.pexels)
    : null;

  for (const segment of timeline) {
    // Download audio
    if (segment.audio) {
      const audioPath = join(workDir, `audio_${segment.id}.mp3`);
      await downloadFile(segment.audio.url, audioPath);
      assets.push({
        segmentId: segment.id,
        visualIndex: -1,
        type: 'audio',
        localPath: audioPath,
      });
      assetIndex++;
      options.onProgress?.(5 + (assetIndex / totalAssets) * 15, `Downloading audio ${segment.id}...`);
    }

    // Download/generate visuals
    for (let i = 0; i < segment.visuals.length; i++) {
      const visual = segment.visuals[i];
      const visualPath = join(workDir, `visual_${segment.id}_${i}`);

      const asset = await prepareVisualAsset(
        visual.source,
        visualPath,
        visual.duration ?? segment.duration,
        options.config,
        pexelsClient
      );

      assets.push({
        segmentId: segment.id,
        visualIndex: i,
        ...asset,
      });

      assetIndex++;
      options.onProgress?.(5 + (assetIndex / totalAssets) * 15, `Preparing visual ${i + 1}...`);
    }
  }

  return assets;
}

async function prepareVisualAsset(
  source: VisualSource,
  basePath: string,
  duration: number,
  config: AssemblyConfig,
  pexelsClient: PexelsClient | null
): Promise<{ type: 'video' | 'image'; localPath: string; duration?: number }> {
  switch (source.type) {
    case 'video':
      await downloadFile(source.url, `${basePath}.mp4`);
      return { type: 'video', localPath: `${basePath}.mp4`, duration };

    case 'image':
      await downloadFile(source.url, `${basePath}.jpg`);
      return { type: 'image', localPath: `${basePath}.jpg`, duration };

    case 'stock':
      if (!pexelsClient) {
        throw new Error('Pexels API key required for stock footage');
      }
      // Search for videos first, fall back to images
      const videos = await pexelsClient.searchVideos(source.query, {
        orientation: config.aspectRatio === '16:9' ? 'landscape' : 'portrait',
        perPage: 1,
      });

      if (videos.length > 0 && videos[0].url) {
        await downloadFile(videos[0].url, `${basePath}.mp4`);
        return { type: 'video', localPath: `${basePath}.mp4`, duration };
      }

      // Fall back to images
      const images = await pexelsClient.searchImages(source.query, { perPage: 1 });
      if (images.length > 0) {
        await downloadFile(images[0].url, `${basePath}.jpg`);
        return { type: 'image', localPath: `${basePath}.jpg`, duration };
      }

      // Generate a text card as fallback
      const fallbackCard = await generateTextCard({
        text: source.query,
        style: 'title',
        width: config.aspectRatio === '16:9' ? 1920 : 1080,
        height: config.aspectRatio === '16:9' ? 1080 : 1920,
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        fontFamily: 'Inter',
      });
      await fsWriteFile(`${basePath}.png`, fallbackCard);
      return { type: 'image', localPath: `${basePath}.png`, duration };

    case 'text_card':
      const cardBuffer = await generateTextCard({
        text: source.text,
        style: source.style,
        width: config.aspectRatio === '16:9' ? 1920 : 1080,
        height: config.aspectRatio === '16:9' ? 1080 : 1920,
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        fontFamily: 'Inter',
      });
      await fsWriteFile(`${basePath}.png`, cardBuffer);
      return { type: 'image', localPath: `${basePath}.png`, duration };

    case 'ai_generated':
      // For AI generation, we'd use the thumbnail generator
      // For now, create a placeholder text card
      const aiPlaceholder = await generateTextCard({
        text: source.prompt.slice(0, 50),
        style: 'title',
        width: config.aspectRatio === '16:9' ? 1920 : 1080,
        height: config.aspectRatio === '16:9' ? 1080 : 1920,
        backgroundColor: '#2a2a4a',
        textColor: '#ffffff',
        fontFamily: 'Inter',
      });
      await fsWriteFile(`${basePath}.png`, aiPlaceholder);
      return { type: 'image', localPath: `${basePath}.png`, duration };

    default:
      throw new Error(`Unknown visual source type`);
  }
}

interface FilterComplexResult {
  filterComplex: string;
  inputFiles: string[];
  hasAudio: boolean;
}

function buildFilterComplex(
  timeline: TimelineSegment[],
  assets: PreparedAsset[],
  config: AssemblyConfig
): FilterComplexResult {
  const resolution = getResolution(config.resolution);
  const filters: string[] = [];
  const inputFiles: string[] = [];
  const videoLabels: string[] = [];
  const audioLabels: string[] = [];

  let inputIndex = 0;

  for (const segment of timeline) {
    const segmentAssets = assets.filter(a => a.segmentId === segment.id);
    const visualAssets = segmentAssets.filter(a => a.type !== 'audio');
    const audioAsset = segmentAssets.find(a => a.type === 'audio');

    // Process visuals for this segment
    for (const visual of visualAssets) {
      inputFiles.push(visual.localPath);
      const inputLabel = `${inputIndex}:v`;
      const outputLabel = `v${inputIndex}`;

      if (visual.type === 'image') {
        // Loop image for duration with Ken Burns effect
        filters.push(
          `[${inputLabel}]loop=loop=-1:size=1:start=0,setpts=N/FRAME_RATE/TB,` +
          `scale=${resolution.width * 1.1}:${resolution.height * 1.1}:force_original_aspect_ratio=increase,` +
          `zoompan=z='min(zoom+0.0005,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil((visual.duration ?? 5) * config.frameRate)}:s=${resolution.width}x${resolution.height},` +
          `trim=duration=${visual.duration ?? 5},setpts=PTS-STARTPTS[${outputLabel}]`
        );
      } else {
        // Scale and trim video
        filters.push(
          `[${inputLabel}]scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,` +
          `pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2,` +
          `trim=duration=${visual.duration ?? 5},setpts=PTS-STARTPTS[${outputLabel}]`
        );
      }

      videoLabels.push(`[${outputLabel}]`);
      inputIndex++;
    }

    // Process audio
    if (audioAsset) {
      inputFiles.push(audioAsset.localPath);
      const inputLabel = `${inputIndex}:a`;
      const outputLabel = `a${inputIndex}`;

      const fadeIn = segment.audio?.fadeIn ?? 0;
      const fadeOut = segment.audio?.fadeOut ?? 0;
      const volume = segment.audio?.volume ?? 1.0;

      let audioFilter = `[${inputLabel}]volume=${volume}`;
      if (fadeIn > 0) {
        audioFilter += `,afade=t=in:st=0:d=${fadeIn}`;
      }
      if (fadeOut > 0) {
        audioFilter += `,afade=t=out:st=${Math.max(0, segment.duration - fadeOut)}:d=${fadeOut}`;
      }
      audioFilter += `[${outputLabel}]`;

      filters.push(audioFilter);
      audioLabels.push(`[${outputLabel}]`);
      inputIndex++;
    }
  }

  // Concatenate all video streams
  if (videoLabels.length > 0) {
    filters.push(
      `${videoLabels.join('')}concat=n=${videoLabels.length}:v=1:a=0[outv]`
    );
  }

  // Concatenate all audio streams
  if (audioLabels.length > 0) {
    filters.push(
      `${audioLabels.join('')}concat=n=${audioLabels.length}:v=0:a=1[outa]`
    );
  }

  return {
    filterComplex: filters.join(';'),
    inputFiles,
    hasAudio: audioLabels.length > 0,
  };
}

interface FfmpegCommandOptions {
  inputs: string[];
  filterComplex: string;
  config: AssemblyConfig;
  outputPath: string;
  hasAudio: boolean;
  backgroundMusic?: string;
}

function buildFfmpegCommand(options: FfmpegCommandOptions): string[] {
  const { inputs, filterComplex, config, outputPath, hasAudio, backgroundMusic } = options;

  const args: string[] = ['-y']; // Overwrite output

  // Add inputs
  for (const input of inputs) {
    args.push('-i', input);
  }

  // Add background music if configured
  if (backgroundMusic) {
    args.push('-i', backgroundMusic);
  }

  // Filter complex
  if (filterComplex) {
    args.push('-filter_complex', filterComplex);
  }

  // Map outputs
  args.push('-map', '[outv]');
  if (hasAudio) {
    args.push('-map', '[outa]');
  }

  // Video codec
  args.push('-c:v', 'libx264');
  args.push('-preset', config.preset);
  args.push('-b:v', config.videoBitrate);
  args.push('-pix_fmt', 'yuv420p');

  // Audio codec
  if (hasAudio) {
    args.push('-c:a', 'aac');
    args.push('-b:a', config.audioBitrate);
  }

  // Frame rate
  args.push('-r', String(config.frameRate));

  // Output
  args.push(outputPath);

  return args;
}

function executeFfmpeg(
  args: string[],
  totalDuration: number,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    process.stderr?.on('data', (data: Buffer) => {
      const line = data.toString();

      // Parse progress from time= output
      const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (timeMatch && totalDuration > 0) {
        const [, hours, minutes, seconds] = timeMatch;
        const currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
        const percent = Math.min((currentTime / totalDuration) * 100, 100);
        onProgress?.(percent);
      }
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('FFmpeg not found. Please install FFmpeg to render videos.'));
      } else {
        reject(err);
      }
    });
  });
}

function getResolution(preset: '720p' | '1080p' | '4k'): { width: number; height: number } {
  switch (preset) {
    case '720p': return { width: 1280, height: 720 };
    case '1080p': return { width: 1920, height: 1080 };
    case '4k': return { width: 3840, height: 2160 };
  }
}

async function downloadFile(url: string, path: string): Promise<void> {
  // Ensure directory exists
  await mkdir(dirname(path), { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fsWriteFile(path, buffer);
}

/**
 * Check if FFmpeg is available
 */
export async function checkFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });

    process.on('close', (code) => {
      resolve(code === 0);
    });

    process.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Get video duration using FFprobe
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ];

    const process = spawn('ffprobe', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let output = '';

    process.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        resolve(isNaN(duration) ? 0 : duration);
      } else {
        reject(new Error(`FFprobe exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        // FFprobe not found, return default
        resolve(5);
      } else {
        reject(err);
      }
    });
  });
}
