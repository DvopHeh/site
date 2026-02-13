<section class="about-wrap">
  <div class="about-hero">
    <p class="about-kicker">ABOUT</p>
    <h1 class="about-title">What is dis:</h1>
    <p class="about-lead">Silly Chaos</p>
  </div>

  <div class="about-grid">
    <article class="about-card">
      <h2>Built With</h2>
      <p>
        SvelteKit + Cloudflare Bullshittery + recently started using Custom APIs
        that somehow work.
      </p>
    </article>
    <article class="about-card">
      <h2>Why?</h2>
      <p>Why not?</p>
    </article>
    <article class="about-card">
      <h2>History</h2>
      <p>
        Back in the day I had a website based on design by my friend Vorlie, now
        there's like only one thing that kinda resembles it.
      </p>
    </article>
  </div>

  <div class="about-panel">
    <h2>Why It Exists</h2>
    <p>
      why not? Every nerd has a cool site (it's not really cool icl), I can
      too... no?
    </p>
  </div>
</section>

<style>
  .about-wrap {
    max-width: 980px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
    animation: about-fade 0.35s ease-out;
  }

  .about-hero {
    text-align: center;
    margin-bottom: 1.4rem;
    padding: 1.4rem;
    border-radius: 14px;
    border: 1px solid var(--color-border);
    background: radial-gradient(
        circle at 15% 10%,
        rgba(122, 44, 224, 0.25),
        transparent 42%
      ),
      radial-gradient(
        circle at 85% 85%,
        rgba(156, 111, 209, 0.22),
        transparent 45%
      ),
      var(--color-surface-alt);
    box-shadow: 0 2px 8px 0 rgb(70, 0, 90);
  }

  .about-kicker {
    margin: 0;
    letter-spacing: 0.18em;
    font-size: 0.78rem;
    color: var(--color-primary);
    font-weight: 700;
  }

  .about-title {
    margin: 0.4rem 0 0.6rem;
    font-size: clamp(2rem, 4vw, 3rem);
    color: var(--color-text);
  }

  .about-lead {
    margin: 0 auto;
    max-width: 740px;
    color: var(--color-text-muted);
    line-height: 1.6;
  }

  .about-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.8rem;
    margin-bottom: 0.8rem;
  }

  .about-card,
  .about-panel {
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    box-shadow: 0 2px 8px 0 rgb(70, 0, 90);
    border-radius: 12px;
  }

  .about-card {
    padding: 1rem;
  }

  .about-card h2,
  .about-panel h2 {
    margin: 0 0 0.45rem;
    font-size: 1.05rem;
    color: var(--color-primary);
  }

  .about-card p,
  .about-panel p {
    margin: 0;
    color: var(--color-text-muted);
    line-height: 1.55;
  }

  .about-panel {
    padding: 1rem 1.1rem;
  }

  @keyframes about-fade {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 860px) {
    .about-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .about-wrap {
      padding: 1rem;
    }
  }
</style>
