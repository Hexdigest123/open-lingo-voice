<script lang="ts">
	import { enhance } from '$app/forms';
	import { t } from '$lib/i18n/index.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>{t('auth.signUp')} - OpenLingo Voice</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
	<div class="w-full max-w-md">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-text-light">{t('auth.registerTitle')}</h1>
			<p class="mt-2 text-text-muted">{t('auth.registerSubtitle')}</p>
		</div>

		<form
			method="POST"
			class="mt-8 space-y-6"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			{#if form?.error}
				<div class="rounded-xl bg-error/10 p-4 text-center text-error">
					{t(form.error)}
				</div>
			{/if}

			<div>
				<label for="displayName" class="mb-2 block font-medium text-text-light"
					>{t('auth.displayName')}</label
				>
				<input
					type="text"
					id="displayName"
					name="displayName"
					required
					class="input"
					placeholder={t('auth.displayNamePlaceholder')}
					value={form?.displayName ?? ''}
					minlength="2"
					maxlength="50"
				/>
			</div>

			<div>
				<label for="email" class="mb-2 block font-medium text-text-light">{t('auth.email')}</label>
				<input
					type="email"
					id="email"
					name="email"
					required
					class="input"
					placeholder={t('auth.emailPlaceholder')}
					value={form?.email ?? ''}
					maxlength="50"
				/>
			</div>

			<div>
				<label for="password" class="mb-2 block font-medium text-text-light"
					>{t('auth.password')}</label
				>
				<input
					type="password"
					id="password"
					name="password"
					required
					class="input"
					placeholder={t('auth.passwordMinChars')}
					minlength="8"
					maxlength="50"
					pattern="[a-zA-Z0-9!@#$%^&*()\-_./]+"
					title="Only ASCII characters allowed: letters, numbers, and !@#$%^&*()-_./"
				/>
				<p class="mt-1 text-sm text-text-muted">{t('auth.passwordHint')}</p>
			</div>

			<div>
				<label for="confirmPassword" class="mb-2 block font-medium text-text-light"
					>{t('auth.confirmPassword')}</label
				>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					class="input"
					placeholder={t('auth.confirmPasswordPlaceholder')}
					minlength="8"
					maxlength="50"
					pattern="[a-zA-Z0-9!@#$%^&*()\-_./]+"
					title="Only ASCII characters allowed: letters, numbers, and !@#$%^&*()-_./"
				/>
			</div>

			<button type="submit" class="btn btn-success btn-lg w-full" disabled={loading}>
				{#if loading}
					{t('auth.creatingAccount')}
				{:else}
					{t('auth.registerButton')}
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-text-muted">
			{t('auth.hasAccount')}
			<a href="/login" class="font-medium text-primary hover:underline">{t('auth.loginButton')}</a>
		</p>
	</div>
</div>
