<script lang="ts">
  import Lanyard from "$lib/components/Lanyard.svelte";
  import GuestbookEntries from "$lib/components/GuestbookEntries.svelte";

  let { profile } = $props<{ profile: unknown }>();
</script>

<div class="column-middle">
  <section class="landing-section lanyard-section">
    <Lanyard {profile} />
  </section>

  <section class="landing-section">
    <h2 class="landing-section-title">More Useless Info about me!</h2>
    <p class="landing-section-desc">
      Well, uh I got friends? (atleast 3), currently running Arch (I Use Arch
      btw.) And idk, I'm a pro minecraft gamer. watching absolutely useless
      documentaries about dumb stuff.
    </p>
  </section>

  <section class="landing-section">
    <h2 class="landing-section-title">Who am I?</h2>
    <ul class="landing-list">
      <li class="landing-list-item">
        <span class="landing-section-desc">
          Idk, a very boring and unimportant person, seriously man, why would
          you wanna know me? I have diabetes... idk what to tell you, but In
          case you do know me, congrats. Proud of you.
        </span>
      </li>
    </ul>
  </section>

  <section class="landing-section">
    <h2 class="landing-section-title">Guestbook</h2>
    <GuestbookEntries />
  </section>
</div>
