<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { i18n, t, type Locale } from '$lib/i18n/index.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { onMount } from 'svelte';
	import { MessageCircle, Settings, Globe, LogOut, Menu, X } from 'lucide-svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	let showLangMenu = $state(false);
	let showUserMenu = $state(false);
	let showMobileMenu = $state(false);

	// Initialize locale from server data if available
	onMount(() => {
		if (data.userLocale && (data.userLocale === 'en' || data.userLocale === 'de')) {
			i18n.setLocale(data.userLocale as Locale);
		}
	});

	// Click-outside action for closing dropdowns
	function clickOutside(node: HTMLElement, callback: () => void) {
		function handleClick(event: MouseEvent) {
			if (!node.contains(event.target as Node)) {
				callback();
			}
		}

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			goto('/login');
		} catch (error) {
			console.error('Logout failed:', error);
			goto('/login');
		}
	}

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	function selectLocale(locale: 'en' | 'de') {
		i18n.setLocale(locale);
		showLangMenu = false;
	}
</script>

<div class="min-h-screen bg-bg-light">
	<!-- Top Bar -->
	<header class="sticky top-0 z-50 border-b border-border-light bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
			<!-- Logo -->
			<a href="/chat" class="flex items-center gap-2">
				<span class="text-xl font-bold text-primary">OpenLingo Voice</span>
			</a>

			<!-- Desktop Navigation -->
			<nav class="hidden items-center gap-3 lg:flex">
				<a
					href="/chat"
					class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors
						{isActive('/chat') ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-light'}"
				>
					<MessageCircle size={18} strokeWidth={2.25} />
					<span>{t('nav.chat')}</span>
				</a>
				<a
					href="/settings"
					class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors
						{isActive('/settings') ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-light'}"
				>
					<Settings size={18} strokeWidth={2.25} />
					<span>{t('nav.settings')}</span>
				</a>
			</nav>

			<div class="flex items-center gap-2">
				<!-- Language Switcher -->
				{#if showLangMenu}
					<div class="relative" use:clickOutside={() => (showLangMenu = false)}>
						<button
							onclick={() => (showLangMenu = !showLangMenu)}
							class="flex cursor-pointer items-center gap-1 rounded-xl bg-primary/10 px-2 py-1 text-sm font-medium text-primary hover:bg-primary/20"
						>
							<Globe size={14} />
							<span class="hidden sm:inline">{i18n.locale === 'de' ? 'DE' : 'EN'}</span>
						</button>
						<div
							class="absolute top-full right-0 mt-2 w-32 rounded-xl border border-border-light bg-white py-1 shadow-lg"
						>
							{#each i18n.availableLocales as locale (locale.code)}
								<button
									onclick={() => selectLocale(locale.code)}
									class="w-full px-4 py-2 text-left first:rounded-t-lg last:rounded-b-lg hover:bg-bg-light-secondary {i18n.locale ===
									locale.code
										? 'font-bold text-primary'
										: 'text-text-light'}"
								>
									{locale.name}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="relative">
						<button
							onclick={() => (showLangMenu = !showLangMenu)}
							class="flex cursor-pointer items-center gap-1 rounded-xl bg-primary/10 px-2 py-1 text-sm font-medium text-primary hover:bg-primary/20"
						>
							<Globe size={14} />
							<span class="hidden sm:inline">{i18n.locale === 'de' ? 'DE' : 'EN'}</span>
						</button>
					</div>
				{/if}

				<!-- User Menu with Logout -->
				{#if showUserMenu}
					<div class="relative" use:clickOutside={() => (showUserMenu = false)}>
						<button
							onclick={() => (showUserMenu = !showUserMenu)}
							class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple text-xs font-bold text-white hover:opacity-90"
							title={data.user.displayName}
						>
							{data.user.displayName.charAt(0).toUpperCase()}
						</button>
						<div
							class="absolute top-full right-0 mt-2 w-48 rounded-xl border border-border-light bg-white py-1 shadow-lg"
						>
							<div class="border-b border-border-light px-4 py-2">
								<p class="font-medium text-text-light">{data.user.displayName}</p>
								<p class="text-xs text-text-muted">{data.user.email}</p>
							</div>
							<a
								href="/settings"
								onclick={() => (showUserMenu = false)}
								class="flex w-full items-center gap-2 px-4 py-2 text-left text-text-light hover:bg-bg-light-secondary"
							>
								<Settings size={16} />
								<span>{t('nav.settings')}</span>
							</a>
							<button
								onclick={handleLogout}
								class="flex w-full items-center gap-2 rounded-b-xl px-4 py-2 text-left text-error hover:bg-error/10"
							>
								<LogOut size={16} />
								<span>{t('nav.logout')}</span>
							</button>
						</div>
					</div>
				{:else}
					<div class="relative">
						<button
							onclick={() => (showUserMenu = !showUserMenu)}
							class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple text-xs font-bold text-white hover:opacity-90"
							title={data.user.displayName}
						>
							{data.user.displayName.charAt(0).toUpperCase()}
						</button>
					</div>
				{/if}

				<!-- Mobile menu toggle -->
				<button
					onclick={() => (showMobileMenu = !showMobileMenu)}
					class="rounded-xl p-2 text-text-muted hover:text-text-light lg:hidden"
					aria-label="Toggle menu"
				>
					{#if showMobileMenu}
						<X size={24} />
					{:else}
						<Menu size={24} />
					{/if}
				</button>
			</div>
		</div>
	</header>

	<!-- Mobile Slide-out Menu (< lg) -->
	{#if showMobileMenu}
		<div class="fixed inset-0 z-[60] lg:hidden">
			<button
				class="absolute inset-0 bg-black/50"
				onclick={() => (showMobileMenu = false)}
				aria-label="Close menu"
			></button>
			<div class="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl">
				<div class="flex items-center justify-between border-b border-border-light p-4">
					<span class="text-lg font-bold text-primary">Menu</span>
					<button
						class="p-2 text-text-muted hover:text-text-light"
						onclick={() => (showMobileMenu = false)}
						aria-label="Close menu"
					>
						<X size={20} />
					</button>
				</div>
				<nav class="space-y-2 p-4">
					<a
						href="/chat"
						onclick={() => (showMobileMenu = false)}
						class="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors
							{isActive('/chat')
							? 'bg-primary/10 text-primary'
							: 'text-text-muted hover:bg-bg-light-secondary hover:text-text-light'}"
					>
						<MessageCircle size={22} strokeWidth={2.25} />
						<span class="font-medium">{t('nav.chat')}</span>
					</a>
					<a
						href="/settings"
						onclick={() => (showMobileMenu = false)}
						class="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors
							{isActive('/settings')
							? 'bg-primary/10 text-primary'
							: 'text-text-muted hover:bg-bg-light-secondary hover:text-text-light'}"
					>
						<Settings size={22} strokeWidth={2.25} />
						<span class="font-medium">{t('nav.settings')}</span>
					</a>
					<button
						onclick={handleLogout}
						class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-error transition-colors hover:bg-error/10"
					>
						<LogOut size={22} strokeWidth={2.25} />
						<span class="font-medium">{t('nav.logout')}</span>
					</button>
				</nav>
			</div>
		</div>
	{/if}

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl px-4 py-6">
		{@render children()}
	</main>
</div>

<!-- Toast Notifications -->
<Toast />
