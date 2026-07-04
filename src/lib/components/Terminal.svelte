<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { starfallEnabled } from "$lib/stores";

  // silly little draggable terminal. ssh into the "server" for the rm -fr / bit.
  // theme/set is just the old debug menu shoved in here. open w/ ctrl+` or ctrl+d
  type Machine = "local" | "server";
  type Seg = { text: string; cls?: string };
  type Line =
    | { type: "text"; segs: Seg[] }
    | { type: "fastfetch"; machine: Machine; info: [string, string][] };

  // window + drag stuff
  let open = $state(false);
  let x = $state(120);
  let y = $state(90);
  let dragging = false;
  let dragDX = 0;
  let dragDY = 0;

  let inputEl: HTMLInputElement | undefined = $state();
  let bodyEl: HTMLElement | undefined = $state();

  // shell state
  let mode = $state<Machine>("local");
  let input = $state("");
  let lines = $state<Line[]>([]);
  let cmdHistory: string[] = [];
  let historyIdx = -1;
  // when set, the next line you type feeds the "sign" prompt instead of a command
  let pending = $state<{ step: "name" | "message"; name?: string } | null>(null);

  const RED = "text-[#e06c6c]";
  const MUTED = "text-[var(--color-text-muted)]";
  const GREEN = "text-[#2ecc71]";
  const YELLOW = "text-[#f0a500]";

  // my actual fastfetch output, just hardcoded lol.
  // logos are single-quoted bc the art is full of backticks. $1/$2 = color codes
  const GENTOO_LOGO = [
    "                   ....",
    "                   ..",
    "               ..........",
    "       .... .....      ..... ....",
    "     ....  ....          ....  ....",
    "   ....   ....    .....   ....    ...",
    "  ...     ...   ........   ...     ...",
    "  ...     ...    .......   ...     ...",
    "   ....    ...    ....    ....   ....",
    "     ....  ....          ....  ....",
    "    .. ....  .....    .....  .... ..",
    "    ..         ....  ....         ..",
    "                ...  ...",
    "                ...  ...",
    "         ...    ...  ...    ...",
    "          ........    ........",
  ].join("\n");

  const PROXMOX_LOGO = [
    "$1         .://:`              `://:.",
    "       `hMMMMMMd/          /dMMMMMMh`",
    "        `sMMMMMMMd:      :mMMMMMMMs`",
    "$2`-/+oo+/:$1`.yMMMMMMMh-  -hMMMMMMMy.`$2:/+oo+/-`",
    "`:oooooooo/$1`-hMMMMMMMyyMMMMMMMh-`$2/oooooooo:`",
    "  `/oooooooo:$1`:mMMMMMMMMMMMMm:`$2:oooooooo/`",
    "    ./ooooooo+-$1 +NMMMMMMMMN+ $2-+ooooooo/.",
    "      .+ooooooo+-$1`oNMMMMNo`$2-+ooooooo+.",
    "        -+ooooooo/.$1`sMMs`$2./ooooooo+-",
    "          :oooooooo/$1`..`$2/oooooooo:",
    "          :oooooooo/`$1..$2`/oooooooo:",
    "        -+ooooooo/.`$1sMMs$2`./ooooooo+-",
    "      .+ooooooo+-`$1oNMMMMNo$2`-+ooooooo+.",
    "    ./ooooooo+-$1 +NMMMMMMMMN+ $2-+ooooooo/.",
    "  `/oooooooo:`$1:mMMMMMMMMMMMMm:$2`:oooooooo/`",
    "`:oooooooo/`$1-hMMMMMMMyyMMMMMMMh-$2`/oooooooo:`",
    "`-/+oo+/:`$1.yMMMMMMMh-  -hMMMMMMMy.$2`:/+oo+/-`",
    "$1        `sMMMMMMMm:      :dMMMMMMMs`",
    "       `hMMMMMMd/          /dMMMMMMh`",
    "         `://:`              `://:`",
  ].join("\n");

  // turns the $1/$2 markers in the art into actual colored chunks
  function parseLogo(
    logo: string,
    logoColors: readonly string[],
    base: string,
  ): { text: string; color: string }[] {
    const out: { text: string; color: string }[] = [];
    let cur = base;
    let buf = "";
    for (let i = 0; i < logo.length; i++) {
      const ch = logo[i];
      const next = logo[i + 1] ?? "";
      if (ch === "$" && next >= "0" && next <= "9") {
        if (buf) out.push({ text: buf, color: cur });
        buf = "";
        const n = Number(next);
        cur = n === 0 ? base : logoColors[n - 1] ?? base;
        i++;
      } else {
        buf += ch;
      }
    }
    if (buf) out.push({ text: buf, color: cur });
    return out;
  }

  const palette = [
    "#2b2b2b",
    "#c05a5a",
    "#8a9a5b",
    "#c9a45b",
    "#7a5a8a",
    "#5a8a8a",
    "#b8b8b8",
    "#d07a7a",
  ];

  const machineData = {
    local: {
      titleSegs: [
        { text: "dvop@brainrot", cls: "text-[#cf8e86] font-semibold" },
      ] as Seg[],
      sep: "-------------",
      logo: GENTOO_LOGO,
      logoColors: ["#cf8e86"] as const,
      logoBase: "#cf8e86",
      keyCls: "text-[#cf8e86] font-semibold",
      bold: false,
      keyWidth: 8,
      info: [
        ["os", "Gentoo Linux x86_64"],
        ["kernel", "Linux 7.0.11-testicles"],
        ["shell", "fish 4.5.0"],
        ["wm", "Hyprland 0.54.3 (Wayland)"],
        ["up", "7 hours, 5 mins"],
        ["cpu", "AMD Ryzen 5 5600X (12) @ 4.65 GHz"],
        ["gpu", "AMD Radeon RX 6600 [Discrete]"],
        ["ram", "7.80 GiB / 31.26 GiB (25%)"],
        ["ip", "192.168.0.113/24"],
        ["disk", "728.75 GiB / 1.47 TiB (48%) - xfs"],
        ["os age", "59 days"],
      ] as [string, string][],
    },
    server: {
      titleSegs: [
        { text: "root", cls: "text-[#e06c6c] font-semibold" },
        { text: "@penis", cls: "text-[#d0a15a] font-semibold" },
      ] as Seg[],
      sep: "----------",
      logo: PROXMOX_LOGO,
      logoColors: ["#e5731f", "#e8965a"] as const,
      logoBase: "#e5731f",
      keyCls: "text-[var(--color-text)] font-semibold",
      bold: true,
      keyWidth: 0,
      info: [
        ["OS", "Proxmox VE 9.2.3 x86_64"],
        ["Kernel", "Linux 7.0.6-2-pve"],
        ["Uptime", "14 days, 3 hours, 49 mins"],
        ["Packages", "955 (dpkg)"],
        ["Shell", "fish 4.0.2"],
        ["Terminal", "/dev/pts/0"],
        ["CPU", "Intel(R) Xeon(R) E5-2680 v4 (28) @ 3.30 GHz"],
        ["GPU", "Intel Arc A310 @ 2.45 GHz [Discrete]"],
        ["Memory", "14.20 GiB / 31.24 GiB (45%)"],
        ["Swap", "4.04 GiB / 70.59 GiB (6%)"],
        ["Disk (/)", "12.06 GiB / 100.86 GiB (12%) - ext4"],
        ["Disk (/home)", "3.99 TiB / 12.67 TiB (31%) - zfs"],
        ["Local IP (vmbr0)", "192.168.0.177/24"],
        ["Locale", "en_US.UTF-8"],
      ] as [string, string][],
    },
  } as const;

  const pad = (s: string, n: number) =>
    s + " ".repeat(Math.max(0, n - s.length));
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(Math.max(v, lo), hi);

  // uptime = how long you've been stuck on my site
  let sessionStart = 0;

  function formatUptime(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const mins = Math.floor((total % 3600) / 60);
    if (!days && !hours && !mins) {
      const secs = total % 60;
      return `${secs} sec${secs === 1 ? "" : "s"}`;
    }
    const parts: string[] = [];
    if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
    if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
    parts.push(`${mins} min${mins === 1 ? "" : "s"}`);
    return parts.join(", ");
  }

  // grab the info rows but swap the fake uptime for the real time-on-site one
  function buildInfo(machine: Machine): [string, string][] {
    const m = machineData[machine];
    const uptimeLabel = machine === "server" ? "Uptime" : "up";
    const uptime = formatUptime(Date.now() - sessionStart);
    return m.info.map(([k, v]): [string, string] =>
      k === uptimeLabel ? [k, uptime] : [k, v],
    );
  }

  function pushFastfetch(machine: Machine) {
    lines = [...lines, { type: "fastfetch", machine, info: buildInfo(machine) }];
  }

  // theme stuff, yoinked out of the old debug menu
  const defaultColors = {
    primary: "#7a2ce0",
    accent: "#9c6fd1",
    border: "#3a008ab0",
    bg: "#000000",
    surface: "#000000",
    surfaceAlt: "#00000018",
    text: "#e8e8e8",
    textMuted: "#b8b8b8",
    link: "#8a49d9",
    linkHover: "#6b3a9e",
  };
  type Colors = typeof defaultColors;

  const presets: Record<string, { theme: string; colors: Colors }> = {
    default: { theme: "dark", colors: { ...defaultColors } },
    light: {
      theme: "light",
      colors: {
        primary: "#e879f9",
        accent: "#c084fc",
        border: "#e879f940",
        bg: "#ffffff",
        surface: "#fdf2f8",
        surfaceAlt: "#ffffff",
        text: "#8b5cf6",
        textMuted: "#374151",
        link: "#e879f9",
        linkHover: "#845ef7",
      },
    },
    gameboy: {
      theme: "gameboy",
      colors: {
        primary: "#9bbc0f",
        accent: "#8bac0f",
        border: "#9bbc0f",
        bg: "#0f380f",
        surface: "#306230",
        surfaceAlt: "#8bac0f",
        text: "#9bbc0f",
        textMuted: "#8bac0f",
        link: "#9bbc0f",
        linkHover: "#306230",
      },
    },
    amber: {
      theme: "dark",
      colors: {
        primary: "#ffb000",
        accent: "#ffd166",
        border: "#8a5a00",
        bg: "#1a1100",
        surface: "#261700",
        surfaceAlt: "#3a2600",
        text: "#ffe8b3",
        textMuted: "#c7a96a",
        link: "#ffcc4d",
        linkHover: "#ffdb80",
      },
    },
    ocean: {
      theme: "dark",
      colors: {
        primary: "#00b4d8",
        accent: "#90e0ef",
        border: "#0077b6",
        bg: "#030b17",
        surface: "#061221",
        surfaceAlt: "#0d1e33",
        text: "#e6f7ff",
        textMuted: "#9ec2d4",
        link: "#48cae4",
        linkHover: "#90e0ef",
      },
    },
    mono: {
      theme: "dark",
      colors: {
        primary: "#f2f2f2",
        accent: "#bdbdbd",
        border: "#4f4f4f",
        bg: "#0f0f0f",
        surface: "#171717",
        surfaceAlt: "#262626",
        text: "#f5f5f5",
        textMuted: "#a3a3a3",
        link: "#e5e5e5",
        linkHover: "#cfcfcf",
      },
    },
    sunset: {
      theme: "dark",
      colors: {
        primary: "#ff6b6b",
        accent: "#ffd6a5",
        border: "#9b2c2c",
        bg: "#17090d",
        surface: "#251015",
        surfaceAlt: "#3a1a21",
        text: "#ffe9d6",
        textMuted: "#e0b9a2",
        link: "#ffadad",
        linkHover: "#ffd6a5",
      },
    },
  };

  let colors: Colors = { ...defaultColors };

  const colorToCssVar: Record<string, string> = {
    primary: "--color-primary",
    accent: "--color-accent",
    border: "--color-border",
    bg: "--color-bg",
    surface: "--color-surface",
    surfaceAlt: "--color-surface-alt",
    text: "--color-text",
    textMuted: "--color-text-muted",
    link: "--color-link",
    linkHover: "--color-link-hover",
  };

  const keyAliases: Record<string, keyof Colors> = {
    primary: "primary",
    accent: "accent",
    border: "border",
    bg: "bg",
    background: "bg",
    surface: "surface",
    surfacealt: "surfaceAlt",
    "surface-alt": "surfaceAlt",
    text: "text",
    textmuted: "textMuted",
    "text-muted": "textMuted",
    link: "link",
    linkhover: "linkHover",
    "link-hover": "linkHover",
  };

  function getCurrentTheme(): string {
    const raw = document.documentElement.getAttribute("data-theme");
    return raw === "light" || raw === "gameboy" ? raw : "dark";
  }

  function updateColor(variable: keyof Colors, value: string) {
    const cssVar = colorToCssVar[variable];
    if (!cssVar) return;
    document.documentElement.style.setProperty(cssVar, value);
    if (variable === "bg") {
      document.documentElement.style.setProperty("--color-bg-alt", value);
      document.documentElement.style.setProperty("--color-bg-base", value);
    }
  }

  function applyPreset(name: string) {
    const preset = presets[name];
    if (!preset) return;
    document.documentElement.setAttribute("data-theme", preset.theme);
    localStorage.setItem("theme", preset.theme);
    colors = { ...preset.colors };
    (Object.keys(preset.colors) as (keyof Colors)[]).forEach((k) =>
      updateColor(k, preset.colors[k]),
    );
  }

  function saveColors() {
    localStorage.setItem(`debug-colors:${getCurrentTheme()}`, JSON.stringify(colors));
  }

  function loadSavedColors() {
    try {
      const stored = localStorage.getItem(`debug-colors:${getCurrentTheme()}`);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<Colors>;
      colors = { ...defaultColors, ...parsed };
      (Object.keys(colors) as (keyof Colors)[]).forEach((k) =>
        updateColor(k, colors[k]),
      );
    } catch (e) {
      console.error("Failed to load saved colors:", e);
    }
  }

  // printing to the "screen"
  function print(text = "", cls?: string) {
    lines = [...lines, { type: "text", segs: [{ text, cls }] }];
  }
  function printSegs(segs: Seg[]) {
    lines = [...lines, { type: "text", segs }];
  }
  function promptSegs(): Seg[] {
    // mid-sign: show a name>/message> prompt instead of the normal shell one
    if (pending) {
      return [{ text: pending.step === "name" ? "name> " : "message> ", cls: YELLOW }];
    }
    return mode === "server"
      ? [
          { text: "root", cls: `${RED} font-semibold` },
          { text: "@penis", cls: "text-[#d0a15a] font-semibold" },
          { text: " ~# ", cls: MUTED },
        ]
      : [
          { text: "dvop@brainrot", cls: "text-[var(--color-primary)] font-semibold" },
          { text: " ~$ ", cls: MUTED },
        ];
  }

  // stick to the bottom when new stuff prints
  $effect(() => {
    lines;
    if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
  });

  // the actual commands
  function printHelp() {
    print("Available commands:", "font-semibold");
    print("  help              show this message");
    print("  fastfetch         show system info");
    print("  theme [name]      change theme (list | reset | save)");
    print("  set <var> <hex>   set a single theme color");
    print("  ssh               connect to the server");
    print("  ping              health-check every API");
    print("  guestbook         show recent guestbook entries");
    print("  sign              sign the guestbook");
    print("  starfall [on|off] toggle the meteor shower");
    print("  man <cmd>         read the manual for a command");
    print("  clear             clear the screen");
    print("  cowsay · whoami · ls · echo · exit");
    print("  (tip: press Tab to autocomplete commands)", MUTED);
  }

  function themeCmd(args: string[]) {
    const sub = (args[0] ?? "").toLowerCase();
    if (!sub || sub === "list") {
      print("Themes: " + Object.keys(presets).join(", "));
      print("Usage: theme <name> | theme reset | theme save", MUTED);
      return;
    }
    if (sub === "reset") {
      applyPreset("default");
      print("Theme reset to default.");
      return;
    }
    if (sub === "save") {
      saveColors();
      print("Current colors saved for this theme.");
      return;
    }
    if (presets[sub]) {
      applyPreset(sub);
      print(`Theme set to ${sub}.`);
    } else {
      print(`Unknown theme: ${sub}. Try 'theme list'.`, RED);
    }
  }

  function setCmd(args: string[]) {
    const norm = keyAliases[(args[0] ?? "").toLowerCase()];
    const val = args[1] ?? "";
    if (!norm || !val) {
      print(
        "Usage: set <primary|accent|border|bg|surface|surfaceAlt|text|textMuted|link|linkHover> <#hex>",
        MUTED,
      );
      return;
    }
    updateColor(norm, val);
    colors = { ...colors, [norm]: val };
    printSegs([
      { text: `${norm} = ` },
      { text: val, cls: "font-semibold" },
      { text: "  ██", cls: "" },
    ]);
  }

  async function sshCmd() {
    print("Connecting to penis (192.168.0.177:22)...", MUTED);
    await sleep(450);
    print("The authenticity of host 'penis' can't be established.", MUTED);
    print("Warning: Permanently added 'penis' to the list of known hosts.", MUTED);
    await sleep(350);
    mode = "server";
    print("");
    print("Welcome to Proxmox VE 9.2.3 (GNU/Linux 7.0.6-2-pve x86_64)", MUTED);
    print("Last login: never — this is a website, calm down.", MUTED);
    print("");
    print("*** RESTRICTED SHELL ***  allowed: fastfetch, rm -fr /", "font-semibold");
  }

  async function rmGag() {
    const targets = [
      "/boot", "/etc", "/usr", "/lib", "/lib64", "/opt",
      "/var", "/srv", "/home", "/root", "/",
    ];
    for (const t of targets) {
      print(`rm: removing everything under '${t}' ...`, RED);
      await sleep(160);
    }
    await sleep(300);
    print("");
    print("Connection to penis closed.", MUTED);
    mode = "local";
    await sleep(250);
    print("(this actually happened accidentally)", `${MUTED} italic`);
  }

  function logout() {
    print("Connection to penis closed.", MUTED);
    mode = "local";
  }

  type PingCheck = {
    name: string;
    state: string;
    httpStatus: number | null;
    latencyMs: number | null;
    message: string;
  };
  type PingPayload = {
    summary?: { ok?: number; degraded?: number; down?: number; total?: number };
    checks?: PingCheck[];
  };

  async function pingCmd() {
    print("PING /api/status — hitting every service...", MUTED);
    let data: PingPayload;
    try {
      const res = await fetch("/api/status");
      if (!res.ok) {
        print(`ping: /api/status returned HTTP ${res.status}`, RED);
        return;
      }
      data = (await res.json()) as PingPayload;
    } catch {
      print("ping: network error — can't even reach the site. grim.", RED);
      return;
    }
    const checks = data.checks ?? [];
    if (!checks.length) {
      print("ping: no services reported.", MUTED);
      return;
    }
    print("");
    for (const c of checks) {
      const cls =
        c.state === "ok"
          ? GREEN
          : c.state === "degraded"
            ? YELLOW
            : c.state === "skipped"
              ? MUTED
              : RED;
      const tag =
        c.state === "ok"
          ? " OK "
          : c.state === "degraded"
            ? "WARN"
            : c.state === "skipped"
              ? "SKIP"
              : "DOWN";
      const http = c.httpStatus != null ? String(c.httpStatus) : "—";
      const ms = c.latencyMs != null ? `${c.latencyMs}ms` : "—";
      printSegs([
        { text: `[${tag}] `, cls: `${cls} font-semibold` },
        { text: pad(c.name, 18) },
        { text: pad(http, 5), cls: MUTED },
        { text: pad(ms, 9), cls: MUTED },
        { text: c.message ?? "", cls: MUTED },
      ]);
    }
    const s = data.summary ?? {};
    const down = s.down ?? 0;
    const degraded = s.degraded ?? 0;
    print("");
    printSegs([
      { text: `${s.ok ?? 0} up`, cls: `${GREEN} font-semibold` },
      { text: "   " },
      { text: `${degraded} degraded`, cls: YELLOW },
      { text: "   " },
      { text: `${down} down`, cls: RED },
      { text: `   / ${s.total ?? 0} total`, cls: MUTED },
    ]);
    if (down > 3) print("oh CLAUDE HELP PLS", RED);
    else if (down > 0 || degraded > 0)
      print("twin we falling apart, tell claude to fix it", YELLOW);
    else print("we shilling twin", GREEN);
  }

  // relative time for guestbook entries — same utc-with-a-Z handling as the site
  function guestbookAgo(dateString: string): string {
    const t = new Date(dateString.replace(" ", "T") + "Z").getTime();
    if (Number.isNaN(t)) return "";
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  // reuse the exact device id the guestbook form saves, so the ban list and the
  // 30s cooldown treat terminal posts the same as form posts
  function guestbookFingerprint(): string {
    try {
      const key = "guestbook_device_id";
      let id = localStorage.getItem(key);
      if (!id) {
        id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
          .replace(/[^a-zA-Z0-9_-]/g, "")
          .slice(0, 64);
        localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return "";
    }
  }

  // print the last few guestbook entries
  async function showGuestbook() {
    print("loading guestbook...", MUTED);
    try {
      const res = await fetch("/api/guestbook");
      if (!res.ok) {
        print(`couldn't load guestbook (${res.status})`, RED);
        return;
      }
      const data = await res.json();
      const entries: Array<{ name: string; message: string; created_at: string }> =
        (data.entries ?? []).slice(0, 8);
      if (!entries.length) {
        print('nothing here yet. be the first — type "sign"', MUTED);
        return;
      }
      print("");
      for (const e of entries) {
        printSegs([
          { text: e.name, cls: "text-[var(--color-primary)] font-semibold" },
          { text: `  ${guestbookAgo(e.created_at)}`, cls: MUTED },
        ]);
        print(`  ${e.message}`);
      }
      print("");
      print('type "sign" to add yours', MUTED);
    } catch {
      print("network error loading guestbook", RED);
    }
  }

  // actually POST it — same endpoint + same checks (bans, cooldown, slurs) as the form
  async function postGuestbook(name: string, message: string) {
    print("posting...", MUTED);
    const form = new FormData();
    form.append("name", name);
    form.append("message", message);
    const fp = guestbookFingerprint();
    if (fp) form.append("fingerprint", fp);
    try {
      const res = await fetch("/api/guestbook", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        print("signed. thanks for stopping by :)", GREEN);
        // poke the on-page guestbook so it shows the new entry too
        window.dispatchEvent(
          new CustomEvent("guestbook:refresh", { detail: { entry: data.entry ?? null } }),
        );
      } else {
        print(data.error || `couldn't post (${res.status})`, RED);
      }
    } catch {
      print("network error, try again", RED);
    }
  }

  // "sign" walks you through name -> message. server still does the real
  // validation, this is just light checks for nicer error messages
  async function handlePending(value: string) {
    if (!pending) return;
    if (value.toLowerCase() === "cancel") {
      pending = null;
      print("cancelled.", MUTED);
      return;
    }
    if (pending.step === "name") {
      if (value.length < 2 || value.length > 20) {
        print('name has to be 2-20 chars. try again (or "cancel"):', MUTED);
        return;
      }
      pending = { step: "message", name: value };
      print("what's your message?", MUTED);
      return;
    }
    if (value.length < 2) {
      print('message needs at least 2 chars. try again (or "cancel"):', MUTED);
      return;
    }
    const name = pending.name ?? "anon";
    pending = null;
    await postGuestbook(name, value);
  }

  function startSign(args: string[]) {
    // one-liner shortcut: sign <name> <message...>
    if (args.length >= 2) {
      void postGuestbook(args[0], args.slice(1).join(" "));
      return;
    }
    pending = { step: "name" };
    print('signing the guestbook (type "cancel" to bail)', MUTED);
    print("what name should i put?", MUTED);
  }

  // fake man pages
  const MANPAGES: Record<string, string[]> = {
    help: ["list every command."],
    fastfetch: ["show system info for this machine.", "alias: neofetch"],
    ssh: [
      "connect to the server (root@penis).",
      "once you're in, only fastfetch and rm -fr / work. behave.",
    ],
    ping: ["poke every api and print whether it's up, degraded or down."],
    theme: [
      "change the site theme.",
      "  theme list      show them all",
      "  theme <name>    apply one",
      "  theme reset     back to default",
      "  theme save      remember your current colors",
    ],
    set: ["set a single theme color.", "  e.g. set primary #ff0000"],
    guestbook: ["show the latest guestbook entries.", "alias: gb"],
    sign: [
      "sign the guestbook.",
      "walks you through name then message,",
      "or one-liner it: sign <name> <message>",
    ],
    starfall: ["toggle the meteor overlay site-wide.", "  starfall on | off"],
    cowsay: ["a cow says whatever you tell it. vital software."],
    man: ["you're literally reading it."],
    clear: ["wipe the screen. alias: cls, or ctrl+l"],
    echo: ["print text back at you."],
    whoami: ["take a wild guess."],
    ls: ["pretend to list some files."],
    exit: ["close the terminal."],
  };

  function manCmd(args: string[]) {
    const topic = (args[0] ?? "").toLowerCase();
    if (!topic) {
      print("what manual page do you want?", MUTED);
      print("usage: man <command>", MUTED);
      return;
    }
    const page = MANPAGES[topic];
    if (!page) {
      print(`no manual entry for ${topic}`, RED);
      return;
    }
    print("");
    print(`${topic.toUpperCase()}(1)`, "font-semibold");
    for (const line of page) print(`  ${line}`);
    print("");
  }

  function cowsay(args: string[]) {
    const text = args.join(" ") || "mooo";
    const bar = " " + "-".repeat(text.length + 2);
    print(bar.replace(/-/g, "_"));
    print(`< ${text} >`);
    print(bar);
    print("        \\   ^__^");
    print("         \\  (oo)\\_______");
    print("            (__)\\       )\\/\\");
    print("                ||----w |");
    print("                ||     ||");
  }

  function starfallCmd(args: string[]) {
    const sub = (args[0] ?? "").toLowerCase();
    const next = sub === "on" ? true : sub === "off" ? false : !get(starfallEnabled);
    starfallEnabled.set(next);
    if (next) print("starfall on. look up. ☄", GREEN);
    else print("starfall off.", MUTED);
  }

  // command names for tab-completion, per shell
  const LOCAL_COMMANDS = [
    "help", "fastfetch", "neofetch", "theme", "set", "ssh", "ping",
    "guestbook", "gb", "sign", "man", "cowsay", "starfall", "clear",
    "cls", "whoami", "echo", "ls", "sudo", "exit",
  ];
  const SERVER_COMMANDS = ["fastfetch", "rm", "help", "exit", "logout"];

  function commonPrefix(words: string[]): string {
    if (!words.length) return "";
    let prefix = words[0];
    for (const w of words) {
      while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
    }
    return prefix;
  }

  // Tab: complete the command word, or list options if it's ambiguous
  function tabComplete() {
    if (pending || input.includes(" ")) return; // only complete the first word
    const cur = input.toLowerCase();
    const pool = mode === "server" ? SERVER_COMMANDS : LOCAL_COMMANDS;
    const matches = pool.filter((c) => c.startsWith(cur));
    if (matches.length === 1) {
      input = matches[0] + " ";
    } else if (matches.length > 1) {
      const prefix = commonPrefix(matches);
      if (prefix.length > input.length) input = prefix;
      printSegs([...promptSegs(), { text: input }]);
      print(matches.join("  "), MUTED);
    }
  }

  function runLocal(name: string, args: string[]) {
    switch (name) {
      case "":
        break;
      case "help":
      case "?":
        printHelp();
        break;
      case "clear":
      case "cls":
        lines = [];
        break;
      case "fastfetch":
      case "neofetch":
        pushFastfetch("local");
        break;
      case "whoami":
        print("dvop");
        break;
      case "echo":
        print(args.join(" "));
        break;
      case "ls":
        print("about.txt  blog/  guestbook/  friends/  secrets.tar.gz");
        break;
      case "theme":
        themeCmd(args);
        break;
      case "set":
        setCmd(args);
        break;
      case "ssh":
        void sshCmd();
        break;
      case "ping":
        void pingCmd();
        break;
      case "guestbook":
      case "gb":
        void showGuestbook();
        break;
      case "sign":
        startSign(args);
        break;
      case "man":
        manCmd(args);
        break;
      case "cowsay":
        cowsay(args);
        break;
      case "starfall":
        starfallCmd(args);
        break;
      case "sudo":
        print("dvop is not in the sudoers file. This incident will be reported.");
        break;
      case "exit":
      case "quit":
      case "close":
        open = false;
        break;
      default:
        print(`${name}: command not found`, RED);
    }
  }

  function runServer(name: string, args: string[]) {
    switch (name) {
      case "":
        break;
      case "fastfetch":
        pushFastfetch("server");
        break;
      case "rm":
        void rmGag();
        break;
      case "exit":
      case "logout":
        logout();
        break;
      case "help":
      case "?":
        print("Available commands: fastfetch, rm -fr /");
        break;
      default:
        print(`-restricted-shell: ${name}: command not allowed`, RED);
    }
  }

  function submit() {
    const raw = input;
    printSegs([...promptSegs(), { text: raw }]);
    const cmd = raw.trim();
    input = "";
    historyIdx = -1;
    if (cmd) cmdHistory.unshift(cmd);
    // if we're mid-sign, this line is an answer, not a command
    if (pending) {
      void handlePending(cmd);
      return;
    }
    const parts = cmd.split(/\s+/);
    const name = (parts[0] ?? "").toLowerCase();
    const args = parts.slice(1);
    if (mode === "server") runServer(name, args);
    else runLocal(name, args);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      tabComplete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length) {
        historyIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
        input = cmdHistory[historyIdx] ?? "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      historyIdx = Math.max(historyIdx - 1, -1);
      input = historyIdx < 0 ? "" : cmdHistory[historyIdx] ?? "";
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      lines = [];
    }
  }

  function welcome() {
    print('TempleOS Reborn Whisperer of God - type "help" for god\'s help', MUTED);
  }

  function toggle() {
    open = !open;
    if (open) {
      if (lines.length === 0) welcome();
      queueMicrotask(() => inputEl?.focus());
    }
  }

  // dragging the window around
  function onDrag(e: PointerEvent) {
    if (!dragging) return;
    x = clamp(e.clientX - dragDX, 0, window.innerWidth - 120);
    y = clamp(e.clientY - dragDY, 0, window.innerHeight - 48);
  }
  function endDrag() {
    dragging = false;
    window.removeEventListener("pointermove", onDrag);
    window.removeEventListener("pointerup", endDrag);
  }
  function startDrag(e: PointerEvent) {
    dragging = true;
    dragDX = e.clientX - x;
    dragDY = e.clientY - y;
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", endDrag);
  }

  onMount(() => {
    loadSavedColors();
    sessionStart = performance.timeOrigin || Date.now();
    if (typeof window !== "undefined") {
      x = clamp(window.innerWidth - 700, 20, window.innerWidth - 200);
      y = 90;
    }
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "`" || e.key === "d")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
</script>

{#if !open}
  <button
    type="button"
    onclick={toggle}
    aria-label="Open terminal"
    class="fixed bottom-4 right-4 z-[9998] flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-lg text-[var(--color-primary)] shadow-lg transition hover:brightness-125"
  >
    &gt;_
  </button>
{/if}

{#if open}
  <div
    class="fixed z-[9999] w-[min(92vw,680px)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
    style="left:{x}px; top:{y}px;"
  >
    <!-- top bar, also the thing you grab to drag it -->
    <div
      role="toolbar"
      tabindex="-1"
      onpointerdown={startDrag}
      class="flex cursor-move touch-none select-none items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2"
    >
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Close terminal"
          onpointerdown={(e) => e.stopPropagation()}
          onclick={() => (open = false)}
          class="h-3 w-3 rounded-full bg-[#ff5f57]"
        ></button>
        <span class="h-3 w-3 rounded-full bg-[#febc2e]"></span>
        <span class="h-3 w-3 rounded-full bg-[#28c840]"></span>
      </div>
      <span class="flex-1 text-center font-mono text-xs text-[var(--color-text-muted)]">
        {mode === "server" ? "root@penis: ~" : "dvop@brainrot: ~"}
      </span>
      <span class="w-12"></span>
    </div>

    <!-- where everything gets dumped -->
    <div
      bind:this={bodyEl}
      role="log"
      onpointerdown={() => inputEl?.focus()}
      class="h-[380px] max-h-[70vh] overflow-y-auto bg-[var(--color-bg)] p-3 font-mono text-[13px] leading-snug text-[var(--color-text)]"
    >
      {#each lines as line}
        {#if line.type === "text"}
          <div class="whitespace-pre-wrap break-words">
            {#each line.segs as seg}<span class={seg.cls}>{seg.text}</span>{/each}
          </div>
        {:else}
          {@const m = machineData[line.machine]}
          <div class="my-1 flex gap-3">
            <pre class="shrink-0 text-[10px] leading-[1.05]">{#each parseLogo(m.logo, m.logoColors, m.logoBase) as run}<span style="color:{run.color};">{run.text}</span>{/each}</pre>
            <div class="min-w-0">
              <div>{#each m.titleSegs as s}<span class={s.cls}>{s.text}</span>{/each}</div>
              <div class={m.keyCls}>{m.sep}</div>
              {#each line.info as row}
                <div class="whitespace-pre-wrap break-words">
                  <span class={m.keyCls}>{m.bold ? row[0] + ":" : pad(row[0], m.keyWidth)}</span
                  ><span> {row[1]}</span>
                </div>
              {/each}
              <div class="mt-1 flex gap-1">
                {#each palette as c}
                  <span class="inline-block h-3 w-3 rounded-sm" style="background:{c};"></span>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      {/each}

      <!-- the input line -->
      <div class="flex items-center whitespace-pre">
        {#each promptSegs() as seg}<span class={seg.cls}>{seg.text}</span>{/each}
        <input
          bind:this={inputEl}
          bind:value={input}
          onkeydown={onKey}
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          class="min-w-0 flex-1 border-none bg-transparent font-mono text-[13px] text-[var(--color-text)] outline-none"
        />
      </div>
    </div>
  </div>
{/if}
