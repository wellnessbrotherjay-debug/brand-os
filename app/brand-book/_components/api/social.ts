
import type { ContentPost, ConnectorConfig } from '../types';

export async function scheduleToInstagram(post: ContentPost, connector: ConnectorConfig) {
  console.log('Stub scheduleToInstagram', { post, connector });
  // TODO: call backend (Supabase Edge Function) that uses Instagram Graph API
  return { success: true, externalId: 'ig_stub_123' };
}

export async function scheduleToFacebook(post: ContentPost, connector: ConnectorConfig) {
  console.log('Stub scheduleToFacebook', { post, connector });
  return { success: true, externalId: 'fb_stub_123' };
}

export async function scheduleToYouTube(post: ContentPost, connector: ConnectorConfig) {
  console.log('Stub scheduleToYouTube', { post, connector });
  return { success: true, externalId: 'yt_stub_123' };
}

export async function scheduleToTikTok(post: ContentPost, connector: ConnectorConfig) {
  console.log('Stub scheduleToTikTok', { post, connector });
  return { success: true, externalId: 'tt_stub_123' };
}
