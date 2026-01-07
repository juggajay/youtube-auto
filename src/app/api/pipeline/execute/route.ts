import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Types for the pipeline execution
interface PipelineInput {
  topic: string;
  title: string;
  hook: string;
  description: string;
  archetype: string;
}

interface ScriptOutput {
  hook: { text: string };
  sections: Array<{ id: string; name: string; script: string }>;
  outro: { text: string; cta: string };
}

// Ensure output directory exists
function ensureOutputDir(): string {
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

// Helper to generate script with Claude
async function generateScript(input: PipelineInput): Promise<ScriptOutput> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a YouTube script writer. Write a complete video script for:

Topic: ${input.topic}
Title: ${input.title}
Opening Hook: ${input.hook}
Format: ${input.archetype || 'listicle'}

Write the script in a conversational, engaging tone. Include:
1. Hook (use the provided opening)
2. 5 main sections (one for each tip/point)
3. Outro with call-to-action

Return ONLY a JSON object with this exact structure:
{
  "hook": { "text": "..." },
  "sections": [
    { "id": "section-1", "name": "Section 1", "script": "..." },
    { "id": "section-2", "name": "Section 2", "script": "..." },
    { "id": "section-3", "name": "Section 3", "script": "..." },
    { "id": "section-4", "name": "Section 4", "script": "..." },
    { "id": "section-5", "name": "Section 5", "script": "..." }
  ],
  "outro": { "text": "...", "cta": "..." }
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('No text response');

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  return JSON.parse(jsonMatch[0]);
}

// Helper to generate voice with ElevenLabs and SAVE TO FILE
async function generateVoice(script: ScriptOutput, outputDir: string): Promise<string> {
  const fullText = [
    script.hook.text,
    ...script.sections.map(s => s.script),
    script.outro.text,
    script.outro.cta,
  ].join('\n\n');

  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text: fullText,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${await response.text()}`);
  }

  // SAVE TO FILE
  const audioBuffer = await response.arrayBuffer();
  const audioPath = path.join(outputDir, 'voiceover.mp3');
  fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

  return audioPath;
}

// Helper to create thumbnail placeholder
async function createThumbnail(outputDir: string): Promise<string> {
  const thumbnailPath = path.join(outputDir, 'thumbnail.png');

  // Try to create a simple thumbnail with FFmpeg
  try {
    await execAsync(`ffmpeg -y -f lavfi -i "color=c=0x1a0a2e:s=1920x1080:d=1" -vframes 1 "${thumbnailPath}"`);
    return thumbnailPath;
  } catch {
    // If FFmpeg fails, create a minimal placeholder
    // This is a 1x1 purple PNG
    const minimalPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0x60, 0x60, 0x60, 0x00,
      0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27, 0x0a, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    fs.writeFileSync(thumbnailPath, minimalPng);
    return thumbnailPath;
  }
}

// Helper to assemble video with FFmpeg
async function assembleVideo(audioPath: string, thumbnailPath: string, outputDir: string): Promise<string> {
  const videoPath = path.join(outputDir, 'final-video.mp4');

  try {
    // Check if FFmpeg is available
    await execAsync('ffmpeg -version');

    // Assemble video: static image + audio
    const cmd = `ffmpeg -y -loop 1 -i "${thumbnailPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoPath}"`;
    await execAsync(cmd);

    return videoPath;
  } catch (error) {
    // FFmpeg not available or failed
    throw new Error(`FFmpeg assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// POST /api/pipeline/execute - Execute full pipeline
export async function POST(request: NextRequest) {
  try {
    const body: PipelineInput = await request.json();

    if (!body.topic || !body.title) {
      return NextResponse.json(
        { error: 'Topic and title are required' },
        { status: 400 }
      );
    }

    const outputDir = ensureOutputDir();

    // Create response stream for progress updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send progress updates
    const sendProgress = async (node: string, status: string, progress: number, data?: unknown) => {
      await writer.write(encoder.encode(
        `data: ${JSON.stringify({ node, status, progress, data })}\n\n`
      ));
    };

    // Start async pipeline execution
    (async () => {
      try {
        // Step 1: Script Generation
        await sendProgress('script', 'running', 10);
        const script = await generateScript(body);

        // Save script to file
        const scriptPath = path.join(outputDir, 'script.json');
        fs.writeFileSync(scriptPath, JSON.stringify(script, null, 2));
        await sendProgress('script', 'completed', 100, { script, path: scriptPath });

        // Step 2: Voice Generation - SAVES TO FILE
        await sendProgress('voice', 'running', 10);
        const audioPath = await generateVoice(script, outputDir);
        const audioStats = fs.statSync(audioPath);
        await sendProgress('voice', 'completed', 100, {
          path: audioPath,
          size: `${(audioStats.size / 1024 / 1024).toFixed(2)} MB`
        });

        // Step 3: Thumbnail Generation - SAVES TO FILE
        await sendProgress('thumbnail', 'running', 10);
        const thumbnailPath = await createThumbnail(outputDir);
        await sendProgress('thumbnail', 'completed', 100, { path: thumbnailPath });

        // Step 4: Assembly - CREATES VIDEO FILE
        await sendProgress('assembly', 'running', 10);
        let videoPath: string;
        let assemblyNote = '';
        try {
          videoPath = await assembleVideo(audioPath, thumbnailPath, outputDir);
          const videoStats = fs.statSync(videoPath);
          assemblyNote = `Video assembled: ${(videoStats.size / 1024 / 1024).toFixed(2)} MB`;
        } catch (error) {
          // FFmpeg not available - save info file instead
          videoPath = path.join(outputDir, 'video-info.json');
          fs.writeFileSync(videoPath, JSON.stringify({
            title: body.title,
            audioPath,
            thumbnailPath,
            status: 'ready-for-assembly',
            note: 'FFmpeg not available. Install FFmpeg to assemble video.',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2));
          assemblyNote = 'FFmpeg not available - assembly skipped';
        }
        await sendProgress('assembly', 'completed', 100, {
          path: videoPath,
          note: assemblyNote
        });

        // Step 5: Publish placeholder
        await sendProgress('publish', 'running', 10);

        // Save upload info
        const uploadInfoPath = path.join(outputDir, 'youtube-upload.json');
        fs.writeFileSync(uploadInfoPath, JSON.stringify({
          title: body.title,
          description: body.description,
          tags: ['sleep', 'health', 'wellness', 'tips', 'lifestyle'],
          categoryId: '26',
          privacyStatus: 'unlisted',
          videoPath,
          status: 'ready-for-upload'
        }, null, 2));

        await sendProgress('publish', 'completed', 100, {
          status: 'ready',
          uploadInfoPath,
          message: 'Video ready for YouTube upload'
        });

        // Send completion with all output paths
        await sendProgress('complete', 'completed', 100, {
          outputDir,
          files: {
            script: path.join(outputDir, 'script.json'),
            audio: audioPath,
            thumbnail: thumbnailPath,
            video: videoPath,
            uploadInfo: uploadInfoPath
          },
          message: 'Pipeline completed! Check the output folder for your files.'
        });

      } catch (error) {
        console.error('Pipeline error:', error);
        await sendProgress('error', 'failed', 0, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Pipeline execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
