<script lang="ts">
	import { t, i18n } from '$lib/i18n/index.svelte';
	import type { Locale } from '$lib/i18n/index.svelte';

	async function setLocale(locale: Locale) {
		i18n.setLocale(locale);

		// Persist locale to database
		const formData = new FormData();
		formData.append('locale', locale);
		try {
			await fetch('?/updateLocale', {
				method: 'POST',
				body: formData
			});
		} catch (error) {
			console.error('Failed to save locale preference:', error);
		}
	}
</script>

<svelte:head>
	<title>{t('settings.title')} - OpenLingo Voice</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-3xl font-bold text-text-light">{t('settings.title')}</h1>

	<!-- Language Settings -->
	<div class="card">
		<h2 class="text-xl font-bold text-text-light">{t('settings.language')}</h2>
		<p class="mt-1 text-text-muted">{t('settings.languageDescription')}</p>
		<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
			{#each i18n.availableLocales as locale (locale.code)}
				<button
					onclick={() => setLocale(locale.code)}
					class="flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-colors
						{i18n.locale === locale.code
						? 'border-primary bg-primary/10 text-primary'
						: 'border-border-light text-text-light hover:border-primary/50'}"
				>
					<span class="text-xl">{locale.code === 'en' ? '🇬🇧' : '🇩🇪'}</span>
					<span>{locale.name}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- API Key Settings -->
	<div class="card">
		<h2 class="text-xl font-bold text-text-light">{t('settings.apiKey.title')}</h2>
		<p class="mt-1 text-text-muted">{t('settings.apiKey.description')}</p>
		<div class="mt-4">
			<a href="/settings/api-key" class="btn btn-primary btn-md">
				{t('settings.apiKey.configure')}
			</a>
		</div>
	</div>
</div>
