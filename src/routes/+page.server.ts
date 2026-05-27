import { env } from '$env/dynamic/public';

const DISCORD_ID = '410475909125242901';
const API_BASE = env.PUBLIC_DISPULL_API_BASE_URL || 'https://dispull.dvop.fyi';

export async function load({ fetch }) {
  try {
    const response = await fetch(`${API_BASE}/api/profile/${DISCORD_ID}`);
    const profile = await response.json();
    return { profile };
  } catch (e) {
    console.error('Error fetching profile data:', e);
    return {
      profile: {
        id: DISCORD_ID,
        username: 'dvop',
        globalName: 'Damned Lurker✨',
        avatarUrl: null,
        bannerUrl: null,
        decorationUrl: null,
      },
    };
  }
}
