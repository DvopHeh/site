<script lang="ts">
  let { showAdmin = false } = $props<{ showAdmin?: boolean }>();
</script>

<div class="blog-header">
  <h1>Blog</h1>
  <a href="/blog/admin" class="admin-link" class:visible={showAdmin}>✏️ Admin</a>
</div>
