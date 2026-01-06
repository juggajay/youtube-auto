// types/nodes/publish.ts

export interface PublishPanelConfig {
  // Platform
  channelId: string;
  channelName: string;
  visibility: 'public' | 'unlisted' | 'private';

  // Metadata
  titleSource: 'generated' | 'override';
  titleOverride?: string;
  descriptionTemplate: string;
  descriptionVariables: Record<string, string>;
  tags: string[];
  autoGenerateTags: boolean;
  maxTags: number;

  // Schedule
  publishMode: 'immediate' | 'scheduled' | 'premiere';
  scheduledTime?: string; // ISO datetime
  premiereCountdown: number; // minutes

  // Advanced
  category: string;
  language: string;
  madeForKids: boolean;
  ageRestricted: boolean;
  allowComments: boolean;
  allowRatings: boolean;
  isShort: boolean;

  // Playlist
  addToPlaylist: boolean;
  playlistId?: string;

  // Notifications
  notifySubscribers: boolean;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  itemCount: number;
}

export const DEFAULT_PUBLISH_CONFIG: PublishPanelConfig = {
  channelId: '',
  channelName: '',
  visibility: 'private',
  titleSource: 'generated',
  titleOverride: '',
  descriptionTemplate: '',
  descriptionVariables: {},
  tags: [],
  autoGenerateTags: true,
  maxTags: 30,
  publishMode: 'immediate',
  scheduledTime: undefined,
  premiereCountdown: 15,
  category: '22', // People & Blogs
  language: 'en',
  madeForKids: false,
  ageRestricted: false,
  allowComments: true,
  allowRatings: true,
  isShort: false,
  addToPlaylist: false,
  playlistId: undefined,
  notifySubscribers: true,
};
