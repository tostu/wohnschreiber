<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import {
		applicationStatusLabels,
		applicationStatusOrder,
		applicationStatusColorClass
	} from '$lib/application-status';

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
	<div class="flex flex-wrap items-center justify-between gap-4">
		<h1 class="ws-title mt-2">
			für „{data.application.listingTitle}"
			{#if data.application.listingUrl}
				<a
					href={data.application.listingUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="ml-2 text-sm font-medium text-(--color-rust) underline">Anzeige ansehen</a
				>
			{/if}
		</h1>
		<form method="POST" action="?/updateStatus" use:enhance>
			<select
				name="status"
				value={data.application.status}
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
				class="{applicationStatusColorClass[
					data.application.status
				]} rounded-full border-0 px-3 py-1.5 text-sm font-medium"
			>
				{#each applicationStatusOrder as status (status)}
					<option value={status}>{applicationStatusLabels[status]}</option>
				{/each}
			</select>
		</form>
	</div>

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

	<div class="mt-6 flex items-center justify-between gap-4">
		<a href={resolve('/apply/new')} class="text-sm font-medium text-(--color-rust) underline"
			>Weitere Bewerbung erstellen</a
		>
		<form
			method="POST"
			action="?/delete"
			use:enhance
			onsubmit={(e) => {
				if (!confirm('Bewerbung wirklich löschen?')) e.preventDefault();
			}}
		>
			<button
				type="submit"
				class="text-sm text-(--color-ink-faint) transition-colors hover:text-(--color-rust-strong)"
			>
				Bewerbung löschen
			</button>
		</form>
	</div>
</div>
