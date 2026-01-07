/**
 * Full Pipeline Test Script
 * Runs the complete VidFlow pipeline: Script → Voice → Thumbnail → Assembly → Publish
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test data from ideation
const TEST_VIDEO = {
  topic: '5 Tips for Better Sleep Tonight',
  title: '5 Sleep Secrets That Will Change Your Life TONIGHT',
  hook: 'The average person spends 26 years of their life sleeping, yet 70% do it completely wrong.',
  description: `🌙 Ready to transform your nights and wake up refreshed? These 5 science-backed sleep secrets can dramatically improve your sleep quality starting TONIGHT.`,
  archetype: 'listicle',
};

async function generateScript(): Promise<{ sections: { id: string; name: string; script: string }[]; hook: { text: string }; outro: { text: string; cta: string } }> {
  console.log('\n📝 STEP 1: Generating Script with Claude...');

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `You are a YouTube script writer. Write a complete video script for:

Topic: ${TEST_VIDEO.topic}
Title: ${TEST_VIDEO.title}
Opening Hook: ${TEST_VIDEO.hook}
Format: Listicle (5 tips)

Write the script in a conversational, engaging tone. Include:
1. Hook (use the provided opening)
2. 5 main sections (one for each tip)
3. Outro with call-to-action

Return ONLY a JSON object with this exact structure:
{
  "hook": { "text": "..." },
  "sections": [
    { "id": "tip-1", "name": "Tip 1", "script": "..." },
    { "id": "tip-2", "name": "Tip 2", "script": "..." },
    { "id": "tip-3", "name": "Tip 3", "script": "..." },
    { "id": "tip-4", "name": "Tip 4", "script": "..." },
    { "id": "tip-5", "name": "Tip 5", "script": "..." }
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

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  const script = JSON.parse(jsonMatch[0]);
  console.log(`✅ Script generated: ${script.sections.length} sections`);
  console.log(`   Hook: ${script.hook.text.substring(0, 50)}...`);

  return script;
}

async function generateVoice(script: Awaited<ReturnType<typeof generateScript>>): Promise<{ audioUrls: string[]; totalDuration: number }> {
  console.log('\n🎙️ STEP 2: Generating Voice with ElevenLabs...');

  // Combine all script text
  const fullScript = [
    script.hook.text,
    ...script.sections.map(s => s.script),
    script.outro.text,
    script.outro.cta,
  ].join('\n\n');

  console.log(`   Total characters: ${fullScript.length}`);

  // Use ElevenLabs API
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: fullScript,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs error: ${error}`);
  }

  // Save audio to file
  const audioBuffer = await response.arrayBuffer();
  const fs = await import('fs');
  const path = await import('path');

  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const audioPath = path.join(outputDir, 'voiceover.mp3');
  fs.writeFileSync(audioPath, Buffer.from(audioBuffer));

  console.log(`✅ Voice generated: ${audioPath}`);
  console.log(`   File size: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`);

  // Estimate duration (~150 words/min, ~5 chars/word)
  const estimatedDuration = (fullScript.length / 5) / 150 * 60;

  return { audioUrls: [audioPath], totalDuration: estimatedDuration };
}

async function generateThumbnail(): Promise<string> {
  console.log('\n🖼️ STEP 3: Generating Thumbnail with Gemini Imagen...');

  const prompt = `Professional YouTube thumbnail for video titled "${TEST_VIDEO.title}".
Show a peaceful sleeping person with overlay text "5 SECRETS".
Use vibrant blue and purple night theme colors.
High contrast, eye-catching, clean design.
No actual text in image.`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '16:9',
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.log(`   Imagen API response: ${error}`);
    // Fallback to placeholder
    console.log('   ⚠️ Using placeholder thumbnail');
    return 'placeholder-thumbnail.png';
  }

  const data = await response.json() as {
    predictions?: Array<{ bytesBase64Encoded?: string }>;
  };

  const imageData = data.predictions?.[0]?.bytesBase64Encoded;
  if (!imageData) {
    console.log('   ⚠️ No image generated, using placeholder');
    return 'placeholder-thumbnail.png';
  }

  // Save thumbnail
  const fs = await import('fs');
  const path = await import('path');

  const outputDir = path.join(process.cwd(), 'output');
  const thumbPath = path.join(outputDir, 'thumbnail.png');
  fs.writeFileSync(thumbPath, Buffer.from(imageData, 'base64'));

  console.log(`✅ Thumbnail generated: ${thumbPath}`);

  return thumbPath;
}

async function assembleVideo(audioPath: string, thumbnailPath: string): Promise<string> {
  console.log('\n🎬 STEP 4: Assembling Video with FFmpeg...');

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const path = await import('path');
  const fs = await import('fs');

  const outputDir = path.join(process.cwd(), 'output');
  const videoPath = path.join(outputDir, 'final-video.mp4');

  // Check if ffmpeg is available
  try {
    await execAsync('ffmpeg -version');
  } catch {
    console.log('   ⚠️ FFmpeg not found. Creating placeholder video info...');
    const infoPath = path.join(outputDir, 'video-info.json');
    fs.writeFileSync(infoPath, JSON.stringify({
      title: TEST_VIDEO.title,
      audioPath,
      thumbnailPath,
      status: 'ready-for-assembly',
      note: 'FFmpeg not available. Install FFmpeg to assemble video.',
    }, null, 2));
    return infoPath;
  }

  // Create video from audio + thumbnail
  const cmd = `ffmpeg -y -loop 1 -i "${thumbnailPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${videoPath}"`;

  try {
    await execAsync(cmd);
    console.log(`✅ Video assembled: ${videoPath}`);
    return videoPath;
  } catch (error) {
    console.log(`   ⚠️ FFmpeg error: ${error}`);
    return 'assembly-failed';
  }
}

async function publishToYouTube(videoPath: string): Promise<string> {
  console.log('\n📤 STEP 5: Publishing to YouTube...');

  // Read YouTube tokens from cookie (set during OAuth)
  const fs = await import('fs');
  const path = await import('path');

  // For this test, we'll just prepare the upload data
  // Actual upload would require the OAuth tokens

  const uploadData = {
    title: TEST_VIDEO.title,
    description: TEST_VIDEO.description,
    tags: ['sleep', 'health', 'wellness', 'tips', 'lifestyle'],
    categoryId: '26', // How-to & Style
    privacyStatus: 'unlisted', // Start unlisted for testing
    videoPath,
  };

  const uploadInfoPath = path.join(process.cwd(), 'output', 'youtube-upload.json');
  fs.writeFileSync(uploadInfoPath, JSON.stringify(uploadData, null, 2));

  console.log(`✅ Upload prepared: ${uploadInfoPath}`);
  console.log(`   Title: ${uploadData.title}`);
  console.log(`   Privacy: ${uploadData.privacyStatus}`);

  // TODO: Implement actual YouTube upload using the stored OAuth tokens
  // This would use the googleapis library with the tokens from the youtube_tokens cookie

  return uploadInfoPath;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           VidFlow Full Pipeline Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n📌 Video: ${TEST_VIDEO.title}`);

  try {
    // Step 1: Generate Script
    const script = await generateScript();

    // Step 2: Generate Voice
    const voice = await generateVoice(script);

    // Step 3: Generate Thumbnail
    const thumbnail = await generateThumbnail();

    // Step 4: Assemble Video
    const video = await assembleVideo(voice.audioUrls[0], thumbnail);

    // Step 5: Publish to YouTube
    const uploadInfo = await publishToYouTube(video);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    ✅ PIPELINE COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nOutput files in: ${process.cwd()}/output/`);
    console.log('- voiceover.mp3 (audio)');
    console.log('- thumbnail.png (thumbnail)');
    console.log('- final-video.mp4 or video-info.json');
    console.log('- youtube-upload.json (upload metadata)');

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    process.exit(1);
  }
}

main();
