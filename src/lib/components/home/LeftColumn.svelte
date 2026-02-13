<script lang="ts">
  import CurrentlyPlaying from "$lib/components/CurrentlyPlaying.svelte";
  import GuestbookForm from "$lib/components/GuestbookForm.svelte";
  import FriendsSection from "$lib/components/home/FriendsSection.svelte";
  import ContactSection from "$lib/components/home/ContactSection.svelte";
</script>

<div class="column-left">
  <FriendsSection />

  <section class="landing-section">
    <div class="section-header">
      <h2 class="landing-section-title">Currently Playing</h2>
      <a href="/played" class="link-button">View Played</a>
    </div>
    <CurrentlyPlaying />
  </section>

  <section class="landing-section">
    <h2 class="landing-section-title">Sign Guestbook (pls I beg u)</h2>
    <GuestbookForm />
  </section>

  <ContactSection />
</div>
