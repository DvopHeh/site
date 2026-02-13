<script lang="ts">
	let name = $state('');
	let message = $state('');
	let errorMessage = $state('');
	let successMessage = $state('');
	let showError = $state(false);
	let showSuccess = $state(false);
	let isSubmitting = $state(false);

	const NAME_MAX = 20;
	const MESSAGE_MAX = 500;

	const trimmedName = $derived(name.trim());
	const trimmedMessage = $derived(message.trim());
	const validationError = $derived.by(() => {
		if (!trimmedName && !trimmedMessage) return '';
		if (trimmedName.length < 2) return 'Name must be at least 2 characters.';
		if (trimmedMessage.length < 2) return 'Message must be at least 2 characters.';
		return '';
	});
	const canSubmit = $derived(
		!isSubmitting &&
			trimmedName.length >= 2 &&
			trimmedName.length <= NAME_MAX &&
			trimmedMessage.length >= 2 &&
			trimmedMessage.length <= MESSAGE_MAX
	);

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!canSubmit) {
			errorMessage = validationError || 'Please fix the form before submitting.';
			showError = true;
			return;
		}

		isSubmitting = true;
		showError = false;
		showSuccess = false;

		const formData = new FormData();
		formData.append('name', trimmedName);
		formData.append('message', trimmedMessage);

		try {
			const response = await fetch('/api/guestbook', {
				method: 'POST',
				body: formData
			});

			let data: { error?: string; entry?: unknown } = {};
			const contentType = response.headers.get('content-type') || '';
			if (contentType.includes('application/json')) {
				data = await response.json();
			}

			if (response.ok) {
				successMessage = 'Entry added successfully!';
				showSuccess = true;
				name = '';
				message = '';
				window.dispatchEvent(new CustomEvent('guestbook:refresh', { detail: { entry: data.entry ?? null } }));
				setTimeout(() => (showSuccess = false), 1800);
			} else {
				errorMessage = data.error || `Request failed (${response.status}). Please try again.`;
				showError = true;
			}
		} catch (err) {
			console.error('Error submitting form:', err);
			errorMessage = 'Network error. Please try again.';
			showError = true;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="guestbook">
	<form class="guestbook-form" onsubmit={handleSubmit}>
		<div class="form-group">
			<input 
				type="text" 
				bind:value={name}
				placeholder="Your name" 
				maxlength={NAME_MAX}
				required 
			/>
			<small>{name.length}/{NAME_MAX}</small>
		</div>
		
		<div class="form-group">
			<textarea 
				bind:value={message}
				placeholder="Your message" 
				maxlength={MESSAGE_MAX}
				rows="3"
				required
			></textarea>
			<small>{message.length}/{MESSAGE_MAX}</small>
		</div>
		
		<button type="submit" class="submit-btn" disabled={!canSubmit}>
			{isSubmitting ? 'Signing...' : 'Sign Guestbook'}
		</button>
	</form>

	<div class="guestbook-status">
		{#if showError}
			<div class="error">{errorMessage}</div>
		{:else if validationError}
			<div class="error">{validationError}</div>
		{/if}
		{#if showSuccess}
			<div class="success">{successMessage}</div>
		{/if}
	</div>
</div>
