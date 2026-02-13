<script lang="ts">
  import CurrentlyPlaying from "$lib/components/CurrentlyPlaying.svelte";
  import GuestbookForm from "$lib/components/GuestbookForm.svelte";
  import FriendsSection from "$lib/components/home/FriendsSection.svelte";
  import ContactSection from "$lib/components/home/ContactSection.svelte";

  let headerVolume: number | null = null;

  function onVolumeChange(event: CustomEvent<{ volume: number | null }>) {
    headerVolume = event.detail.volume;
  }
</script>

<div class="column-left">
  <FriendsSection />

  <section class="landing-section">
    <div class="section-header">
      <div class="section-header-title-wrap">
        <h2 class="landing-section-title">Currently Playing</h2>
        {#if headerVolume != null}
          <div class="section-header-volume" title={`Volume ${headerVolume}%`}>
            <svg
              class="section-header-volume-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8.2 16.8a2.6 2.6 0 1 1-1.3-2.3v-7l9.2-2.3v8.6a2.6 2.6 0 1 1-1.3-2.3V7.6L8.2 9.3v7.5zm-1.3-7.5 7.9-2V4.9L6.9 6.9v2.4z"
                stroke="currentColor"
                stroke-width="1.25"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="section-header-volume-meter" aria-hidden="true">
              <span
                class="section-header-volume-fill"
                style={`height: ${Math.max(0, Math.min(100, headerVolume))}%`}
              ></span>
            </span>
          </div>
        {/if}
      </div>
      <a href="/played" class="link-button">View Played</a>
    </div>
    <CurrentlyPlaying on:volumechange={onVolumeChange} />
  </section>

  <section class="landing-section">
    <h2 class="landing-section-title">Sign Guestbook (pls I beg u)</h2>
    <GuestbookForm />
  </section>

  <ContactSection />
</div>
