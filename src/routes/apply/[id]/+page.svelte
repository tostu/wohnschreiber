<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	let copied = $state(false);

	async function copyMessage() {
		await navigator.clipboard.writeText(data.application.generatedMessage);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="ws-shell">
	<div class="flex items-center gap-2 text-(--color-sage)">
		<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
			<circle cx="10" cy="10" r="8" />
			<path d="M6.5 10.2 8.7 12.5 13.5 7.5" />
		</svg>
		<span class="ws-eyebrow text-(--color-sage)">Bereit zum Versenden</span>
	</div>
	<h1 class="ws-title mt-2">für „{data.application.listingTitle}"</h1>

	<section class="ws-card mt-8 p-6">
		<h2 class="text-sm font-semibold text-(--color-ink-soft)">Kontaktnachricht für WG-Gesucht</h2>
		<p class="mt-3 leading-relaxed whitespace-pre-wrap text-(--color-ink)">
			{data.application.generatedMessage}
		</p>
		<button onclick={copyMessage} class="ws-btn ws-btn-primary mt-4">
			{#if copied}
				Kopiert ✓
			{:else}
				Text kopieren
			{/if}
		</button>
	</section>

	<section class="ws-card mt-4 flex items-center justify-between gap-4 p-6">
		<div>
			<h2 class="text-sm font-semibold text-(--color-ink-soft)">Anhang</h2>
			<p class="ws-subtitle mt-1">
				Anschreiben + ausgewählte Dokumente als eine PDF, zum Anhängen an die Kontaktnachricht.
			</p>
		</div>
		<a
			href={resolve('/apply/[id]/pdf', { id: data.application.id })}
			class="ws-btn ws-btn-secondary shrink-0"
		>
			PDF herunterladen
		</a>
	</section>

	<a
		href={resolve('/apply/new')}
		class="mt-6 inline-block text-sm font-medium text-(--color-rust) underline"
		>Weitere Bewerbung erstellen</a
	>
</div>
