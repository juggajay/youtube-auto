/**
 * Upload Video to YouTube
 * Uses the OAuth tokens from the VidFlow OAuth flow
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { google } from 'googleapis';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;

// YouTube tokens from environment variables
// Set these from the OAuth flow cookie or run the OAuth flow first
const TOKENS = {
  accessToken: process.env.YOUTUBE_ACCESS_TOKEN || '',
  refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
  expiresAt: parseInt(process.env.YOUTUBE_TOKEN_EXPIRES_AT || '0', 10),
};

if (!TOKENS.accessToken || !TOKENS.refreshToken) {
  console.error('❌ Missing YouTube tokens. Set YOUTUBE_ACCESS_TOKEN and YOUTUBE_REFRESH_TOKEN in .env.local');
  console.error('   Or run the OAuth flow at http://localhost:3001/api/youtube/auth');
  process.exit(1);
}

// Video metadata
const VIDEO = {
  title: '5 Sleep Secrets That Will Change Your Life TONIGHT',
  description: `🌙 Ready to transform your nights and wake up refreshed? These 5 science-backed sleep secrets can dramatically improve your sleep quality starting TONIGHT - no expensive gadgets or complicated routines required.

If you're tired of tossing and turning, this video will change everything.

✨ What You'll Learn:
• The 3-2-1 rule that primes your body for deep sleep
• Why your bedroom temperature could be sabotaging your rest
• The counterintuitive breathing technique that works in under 2 minutes
• How to hack your circadian rhythm using simple light exposure
• The surprising food timing trick that enhances sleep quality by 40%

⏰ Timestamps:
[00:00] Introduction: Why Most People Sleep Wrong
[01:30] Secret #1: The 3-2-1 Pre-Sleep Protocol
[03:45] Secret #2: Your Bedroom's Hidden Sleep Killer
[05:20] Secret #3: The Military Sleep Technique
[07:10] Secret #4: Light Exposure Timing
[09:00] Secret #5: The Sleep-Enhancing Food Window
[10:45] Putting It All Together

💤 Ready to finally get the restorative sleep you deserve? Hit SUBSCRIBE for more science-based health tips!

#SleepTips #BetterSleep #SleepHacks #HealthyLiving #SleepScience #Wellness

---
🤖 Generated with VidFlow - AI-Powered Video Production`,
  tags: ['sleep', 'health', 'wellness', 'tips', 'lifestyle', 'sleep tips', 'better sleep', 'insomnia', 'sleep hacks'],
  categoryId: '26', // How-to & Style
  privacyStatus: 'unlisted' as const,
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           YouTube Upload');
  console.log('═══════════════════════════════════════════════════════════');

  const videoPath = path.join(process.cwd(), 'output', 'final-video.mp4');
  const thumbnailPath = path.join(process.cwd(), 'output', 'thumbnail.png');

  if (!fs.existsSync(videoPath)) {
    console.error('❌ Video file not found:', videoPath);
    process.exit(1);
  }

  console.log(`\n📹 Video: ${videoPath}`);
  console.log(`📝 Title: ${VIDEO.title}`);
  console.log(`🔒 Privacy: ${VIDEO.privacyStatus}`);

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    'http://localhost:3001/api/youtube/auth/callback'
  );

  // Set credentials
  oauth2Client.setCredentials({
    access_token: TOKENS.accessToken,
    refresh_token: TOKENS.refreshToken,
    expiry_date: TOKENS.expiresAt,
  });

  // Check if token needs refresh
  if (Date.now() > TOKENS.expiresAt - 5 * 60 * 1000) {
    console.log('\n🔄 Refreshing access token...');
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('✅ Token refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      process.exit(1);
    }
  }

  // Create YouTube client
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  console.log('\n📤 Uploading video to YouTube...');

  try {
    // Upload video
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: VIDEO.title,
          description: VIDEO.description,
          tags: VIDEO.tags,
          categoryId: VIDEO.categoryId,
        },
        status: {
          privacyStatus: VIDEO.privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    const videoId = response.data.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    ✅ UPLOAD COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n🎬 Video ID: ${videoId}`);
    console.log(`🔗 URL: ${videoUrl}`);
    console.log(`📊 Status: ${response.data.status?.uploadStatus}`);

    // Try to set thumbnail
    if (fs.existsSync(thumbnailPath)) {
      console.log('\n🖼️ Setting custom thumbnail...');
      try {
        await youtube.thumbnails.set({
          videoId: videoId!,
          media: {
            body: fs.createReadStream(thumbnailPath),
          },
        });
        console.log('✅ Thumbnail set');
      } catch (thumbError) {
        console.log('⚠️ Could not set thumbnail (may require verified account)');
      }
    }

    // Save result
    const resultPath = path.join(process.cwd(), 'output', 'upload-result.json');
    fs.writeFileSync(resultPath, JSON.stringify({
      videoId,
      videoUrl,
      title: VIDEO.title,
      privacyStatus: VIDEO.privacyStatus,
      uploadedAt: new Date().toISOString(),
    }, null, 2));

    console.log(`\n📁 Result saved to: ${resultPath}`);

  } catch (error: any) {
    console.error('\n❌ Upload failed:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
