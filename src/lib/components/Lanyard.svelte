<script lang="ts">
  const DEFAULT_AVATAR = "/images/default.jpg";

  interface Profile {
    id: string;
    username: string;
    globalName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    decorationUrl: string | null;
  }

  let { profile }: { profile: Profile } = $props();

  let avatarFailed = $state(false);

  let DISCORD_ID = $derived(profile.id || "410475909125242901");
  let avatarUrl = $derived(
    avatarFailed ? DEFAULT_AVATAR : profile.avatarUrl || DEFAULT_AVATAR,
  );
  let decorationUrl = $derived(profile.decorationUrl || "/images/decor.png");
  let bannerUrl = $derived(profile.bannerUrl || "/images/banner.jpg");
  let displayName = $derived(
    profile.globalName || profile.username || "Damned Lurker✨",
  );
  let username = $derived(profile.username || "dvop");
</script>

<div
  class="lanyard-container"
  style={bannerUrl ? `background-image: url(${bannerUrl});` : ""}
>
  <div class="dvop">
    <img
      id="avatar"
      src={avatarUrl}
      alt="User Avatar"
      onerror={() => (avatarFailed = true)}
    />
    <img id="avatar-deco" src={decorationUrl} alt="" />
    <div class="userinfo">
      <p style="margin: 4px auto; font-weight: 600; font-size: 20px;">
        <a
          href="https://discord.com/users/{DISCORD_ID}"
          target="_blank"
          style="color: var(--color-link);"
        >
          {displayName}
        </a>
        <br />
        <span style="color: var(--color-primary);">@{username}</span>
      </p>
    </div>
  </div>
</div>

<style>
  .lanyard-container {
    background-size: cover;
    background-position: center;
    border-radius: var(--radius-md);
    padding: 1rem;
    position: relative;
  }

  .lanyard-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: var(--radius-md);
  }

  .lanyard-container .dvop {
    position: relative;
    z-index: 1;
  }
</style>
