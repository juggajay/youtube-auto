export interface StockVideo {
  id: string;
  url: string;
  duration: number;
  width: number;
  height: number;
  thumbnail: string;
}

export interface StockImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  image: string;
  video_files: PexelsVideoFile[];
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
  };
}

export class PexelsClient {
  private apiKey: string;
  private baseUrl = 'https://api.pexels.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchVideos(query: string, options?: {
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
    perPage?: number;
  }): Promise<StockVideo[]> {
    const params = new URLSearchParams({
      query,
      orientation: options?.orientation ?? 'landscape',
      size: options?.size ?? 'medium',
      per_page: String(options?.perPage ?? 5),
    });

    const response = await fetch(`${this.baseUrl}/videos/search?${params}`, {
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels video search failed: ${response.status}`);
    }

    const data = await response.json() as { videos: PexelsVideo[] };

    return data.videos.map((v) => {
      // Prefer HD quality, fallback to first available
      const hdFile = v.video_files.find(f => f.quality === 'hd');
      const videoFile = hdFile ?? v.video_files[0];

      return {
        id: String(v.id),
        url: videoFile?.link ?? '',
        duration: v.duration,
        width: v.width,
        height: v.height,
        thumbnail: v.image,
      };
    });
  }

  async searchImages(query: string, options?: {
    orientation?: 'landscape' | 'portrait' | 'square';
    perPage?: number;
  }): Promise<StockImage[]> {
    const params = new URLSearchParams({
      query,
      orientation: options?.orientation ?? 'landscape',
      per_page: String(options?.perPage ?? 5),
    });

    const response = await fetch(`${this.baseUrl}/v1/search?${params}`, {
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels image search failed: ${response.status}`);
    }

    const data = await response.json() as { photos: PexelsPhoto[] };

    return data.photos.map((p) => ({
      id: String(p.id),
      url: p.src.large2x,
      width: p.width,
      height: p.height,
    }));
  }

  async downloadVideo(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

// Factory function
export function createStockClient(provider: 'pexels' | 'storyblocks', apiKey: string): PexelsClient {
  // For now, only Pexels is implemented
  if (provider !== 'pexels') {
    throw new Error(`Stock provider "${provider}" not implemented`);
  }
  return new PexelsClient(apiKey);
}
