<script lang="ts">
  import GuestbookForm from "$lib/components/GuestbookForm.svelte";
  import ContactSection from "$lib/components/home/ContactSection.svelte";
  import FriendsSection from "$lib/components/home/FriendsSection.svelte";
</script>

<div class="column-left">
  <FriendsSection />

  <section class="landing-section">
    <h2 class="landing-section-title">Sign Guestbook (pls I beg u)</h2>
    <GuestbookForm />
  </section>

  <ContactSection />
</div>
