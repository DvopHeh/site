<script lang="ts">
	let name = $state('');
	let message = $state('');
	let errorMessage = $state('');
	let successMessage = $state('');
	let showError = $state(false);
	let showSuccess = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		showError = false;
		showSuccess = false;
		
		const formData = new FormData();
		formData.append('name', name);
		formData.append('message', message);
		
		try {
			const response = await fetch('/api/guestbook', {
				method: 'POST',
				body: formData
			});
			
			const data = await response.json();
			
			if (response.ok) {
				successMessage = 'Entry added successfully!';
				showSuccess = true;
				name = '';
				message = '';
				setTimeout(() => {
					showSuccess = false;
					window.location.reload();
				}, 1000);
			} else {
				errorMessage = data.error || 'An error occurred';
				showError = true;
			}
		} catch (err) {
			console.error('Error submitting form:', err);
			errorMessage = 'Network error. Please try again.';
			showError = true;
		}
	}
</script>

<div class="guestbook">
	{#if showError}
		<div class="error">{errorMessage}</div>
	{/if}
	{#if showSuccess}
		<div class="success">{successMessage}</div>
	{/if}
	
	<form class="guestbook-form" onsubmit={handleSubmit}>
		<div class="form-group">
			<input 
				type="text" 
				bind:value={name}
				placeholder="Your name" 
				maxlength="20"
				required 
			/>
		</div>
		
		<div class="form-group">
			<textarea 
				bind:value={message}
				placeholder="Your message" 
				maxlength="500"
				rows="3"
				required
			></textarea>
		</div>
		
		<button type="submit" class="submit-btn">Sign Guestbook</button>
	</form>
</div>
