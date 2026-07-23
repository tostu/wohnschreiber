<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { LayoutServerData } from './$types';
	import type { Snippet } from 'svelte';

	let { children, data }: { children: Snippet; data: LayoutServerData } = $props();

	let menuOpen = $state(false);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="border-b border-(--color-paper-line)">
	<nav class="ws-shell flex items-center justify-between py-0!">
		<a href={resolve('/')} class="ws-title py-4 text-lg">Wohnschreiber</a>

		{#if data.user}
			<div class="hidden items-center gap-4 text-sm sm:flex">
				<a href={resolve('/profile')} class="text-(--color-ink-soft) hover:text-(--color-rust)"
					>Profil</a
				>
				<a href={resolve('/documents')} class="text-(--color-ink-soft) hover:text-(--color-rust)"
					>Dokumente</a
				>
				<a href={resolve('/apply')} class="text-(--color-ink-soft) hover:text-(--color-rust)"
					>Bewerbungen</a
				>
				<form method="post" action="/logout" use:enhance>
					<button class="ws-btn ws-btn-secondary px-3 py-1.5 text-xs">Abmelden</button>
				</form>
			</div>
			<button
				type="button"
				onclick={() => (menuOpen = !menuOpen)}
				aria-expanded={menuOpen}
				aria-label="Menü"
				class="ws-btn-ghost -mr-1 inline-flex items-center p-2 sm:hidden"
			>
				<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					{#if menuOpen}
						<path d="M6 6 18 18M18 6 6 18" stroke-linecap="round" />
					{:else}
						<path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
					{/if}
				</svg>
			</button>
		{:else}
			<a href={resolve('/login')} class="ws-btn ws-btn-primary px-3 py-1.5 text-xs">Anmelden</a>
		{/if}
	</nav>

	{#if data.user && menuOpen}
		<div class="border-t border-(--color-paper-line) sm:hidden">
			<div class="mx-auto flex max-w-2xl flex-col gap-1 px-5 py-3">
				<a
					href={resolve('/profile')}
					onclick={() => (menuOpen = false)}
					class="py-2 text-(--color-ink-soft) hover:text-(--color-rust)">Profil</a
				>
				<a
					href={resolve('/documents')}
					onclick={() => (menuOpen = false)}
					class="py-2 text-(--color-ink-soft) hover:text-(--color-rust)">Dokumente</a
				>
				<a
					href={resolve('/apply')}
					onclick={() => (menuOpen = false)}
					class="py-2 text-(--color-ink-soft) hover:text-(--color-rust)">Bewerbungen</a
				>
				<form method="post" action="/logout" use:enhance class="mt-2">
					<button class="ws-btn ws-btn-secondary w-full px-3 py-2 text-sm">Abmelden</button>
				</form>
			</div>
		</div>
	{/if}
</header>

{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
