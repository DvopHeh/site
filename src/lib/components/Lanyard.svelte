<script lang="ts">
  import { onMount } from "svelte";

  let avatarBorder = $state("var(--color-status-offline)");
  const DEFAULT_AVATAR = "/images/default.jpg";
  let avatarUrl = $state(DEFAULT_AVATAR);
  let decorationUrl = $state("/images/decor.png");
  let bannerUrl = $state<string | null>("/images/banner.jpg");
  let displayName = $state("Damned Lurker✨");
  let username = $state("dvop");

  const DISCORD_ID = "410475909125242901";

  onMount(() => {
    // Fetch initial data from REST API
    fetchUserData();

    // Connect to Lanyard WebSocket for live status updates
    const ws = new WebSocket("wss://api.lanyard.rest/socket");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          op: 2,
          d: { subscribe_to_id: DISCORD_ID },
        }),
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.op === 1) {
        // Heartbeat interval
        setInterval(() => {
          ws.send(JSON.stringify({ op: 3 }));
        }, data.d.heartbeat_interval);
      }

      if (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE") {
        updateFromLanyardData(data.d);
      }
    };

    return () => ws.close();
  });

  async function fetchUserData() {
    try {
      const response = await fetch(
        `https://api.lanyard.rest/v1/users/${DISCORD_ID}`,
      );
      const data = await response.json();
      if (data.success) {
        updateFromLanyardData(data.data);
      }
    } catch (e) {
      console.error("Error fetching Lanyard data:", e);
    }
  }

  function updateFromLanyardData(data: any) {
    const status = data?.discord_status;
    updateStatus(status);

    const user = data?.discord_user;
    if (user) {
      // Update display name and username
      displayName =
        user.global_name ||
        user.display_name ||
        user.username ||
        "Damned Lurker✨";
      username = user.username || "dvop";

      // Update avatar
      if (user.avatar) {
        if (typeof user.avatar === "string" && user.avatar.startsWith("http")) {
          avatarUrl = user.avatar;
        } else {
          const ext = user.avatar.startsWith("a_") ? "gif" : "png";
          avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${user.avatar}.${ext}?size=128`;
        }
      } else {
        avatarUrl = DEFAULT_AVATAR;
      }

      // Update banner
      if (user.banner) {
        const ext = user.banner.startsWith("a_") ? "gif" : "png";
        bannerUrl = `https://cdn.discordapp.com/banners/${DISCORD_ID}/${user.banner}.${ext}?size=480`;
      }

      // Update avatar decoration
      if (user.avatar_decoration_data?.asset) {
        decorationUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png`;
      }
    }
  }

  function updateStatus(status: string) {
    const statusColors: Record<string, string> = {
      online: "var(--color-status-online)",
      dnd: "var(--color-status-dnd)",
      idle: "var(--color-status-idle)",
      offline: "var(--color-status-offline)",
    };
    avatarBorder = statusColors[status] || statusColors.offline;
  }
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
      style="border-color: {avatarBorder};"
      on:error={() => (avatarUrl = DEFAULT_AVATAR)}
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
    border-radius: 8px;
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
    border-radius: 8px;
  }

  .lanyard-container .dvop {
    position: relative;
    z-index: 1;
  }
</style>
