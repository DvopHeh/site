<script lang="ts">
  // meteor shower overlay. a canvas full of shooting stars + a faint twinkling
  // starfield, drawn in the current theme color. purely decorative, sits on top
  // of everything but ignores clicks
  import { onMount } from "svelte";

  let canvas: HTMLCanvasElement | undefined = $state();

  interface Meteor {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
  }
  interface Star {
    x: number;
    y: number;
    r: number;
    tw: number;
  }

  onMount(() => {
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let frames = 0;
    let lastSpawn = 0;
    const meteors: Meteor[] = [];
    const stars: Star[] = [];

    // pull the theme's primary color for the meteors so it recolors with the site
    const readColor = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim() || "#7a2ce0";
    let primary = readColor();

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // rebuild the starfield to match the new size
      stars.length = 0;
      const count = Math.round((w * h) / 11000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.1 + 0.2,
          tw: Math.random() * Math.PI * 2,
        });
      }
    }

    // spawn a shooting star up top somewhere, heading down and to the left
    function spawn() {
      meteors.push({
        x: w * 0.3 + Math.random() * w * 0.9,
        y: -40 + Math.random() * h * 0.3,
        vx: -(2 + Math.random() * 4),
        vy: 4 + Math.random() * 6,
        life: 0,
        max: 100 + Math.random() * 80,
      });
    }

    function frame(t: number) {
      ctx!.clearRect(0, 0, w, h);
      frames++;
      if (frames % 90 === 0) primary = readColor(); // catch theme changes

      // twinkly background stars
      for (const s of stars) {
        s.tw += 0.02;
        ctx!.globalAlpha = 0.25 + Math.abs(Math.sin(s.tw)) * 0.5;
        ctx!.fillStyle = primary;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      // drip a new meteor every so often
      if (t - lastSpawn > 260 + Math.random() * 320 && meteors.length < 22) {
        spawn();
        lastSpawn = t;
      }

      // draw + move meteors (backwards so we can splice dead ones)
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const tailX = m.x - m.vx * 6;
        const tailY = m.y - m.vy * 6;
        const grad = ctx!.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, primary);
        grad.addColorStop(1, "transparent");
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.moveTo(m.x, m.y);
        ctx!.lineTo(tailX, tailY);
        ctx!.stroke();
        // bright little head
        ctx!.fillStyle = "#fff";
        ctx!.beginPath();
        ctx!.arc(m.x, m.y, 1.5, 0, Math.PI * 2);
        ctx!.fill();

        m.x += m.vx;
        m.y += m.vy;
        m.life++;
        if (m.y > h + 60 || m.x < -60 || m.life > m.max) meteors.splice(i, 1);
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  });
</script>

<canvas
  bind:this={canvas}
  aria-hidden="true"
  class="pointer-events-none fixed inset-0 z-[9000] h-screen w-screen"
></canvas>
