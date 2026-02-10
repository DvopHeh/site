const DISCORD_ID = "410475909125242901";

export async function load({ fetch }) {
  try {
    const response = await fetch(
      `https://dispull.dvop.fyi/api/profile/${DISCORD_ID}`,
    );
    const profile = await response.json();
    return { profile };
  } catch (e) {
    console.error("Error fetching profile data:", e);
    return {
      profile: {
        id: DISCORD_ID,
        username: "dvop",
        globalName: "Damned Lurker✨",
        avatarUrl: null,
        bannerUrl: null,
        decorationUrl: null,
      },
    };
  }
}
