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
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header class="border-b border-(--color-paper-line)">
	<nav class="ws-shell flex items-center justify-between py-0!">
		<a href={resolve('/')} class="ws-title py-4 text-lg">Wohnschreiber</a>

		{#if data.user}
			<div class="flex items-center gap-4 text-sm">
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
		{:else}
			<a href={resolve('/login')} class="ws-btn ws-btn-primary px-3 py-1.5 text-xs">Anmelden</a>
		{/if}
	</nav>
</header>

{@render children()}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
