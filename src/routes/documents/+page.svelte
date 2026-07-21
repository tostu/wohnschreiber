<script lang="ts">
	import { Tabs } from 'bits-ui';
	import DocumentUploadCard from '$lib/components/DocumentUploadCard.svelte';
	import SelbstauskunftCard from '$lib/components/SelbstauskunftCard.svelte';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	const requiredTypes: { type: string; label: string }[] = [
		{ type: 'bonitaetsnachweis', label: 'Bonitätsnachweis' },
		{ type: 'personalausweis', label: 'Personalausweis' }
	];

	const optionalTypes: { type: string; label: string }[] = [
		{ type: 'einkommensnachweis', label: 'Einkommensnachweis' },
		{ type: 'buergschaft', label: 'Bürgschaft' },
		{ type: 'immatrikulationsbescheinigung', label: 'Immatrikulationsbescheinigung' },
		{ type: 'lohnnachweis', label: 'Lohnnachweis' }
	];

	function findDoc(type: string) {
		return data.documents.find((d) => d.type === type) ?? null;
	}

	const missingRequired = $derived(
		requiredTypes.filter(({ type }) => !findDoc(type)).length + (findDoc('selbstauskunft') ? 0 : 1)
	);
</script>

<div class="ws-shell">
	<span class="ws-eyebrow">Schritt 2</span>
	<h1 class="ws-title mt-2">Deine Dokumente</h1>
	<p class="ws-subtitle">
		Diese Dokumente werden zusammen mit dem generierten Anschreiben zu einer PDF zusammengefügt.
	</p>

	{#if missingRequired > 0}
		<p class="ws-alert ws-alert-info mt-5">
			Noch {missingRequired} Pflichtdokument{missingRequired > 1 ? 'e' : ''} offen.
		</p>
	{:else}
		<p class="ws-alert ws-alert-success mt-5">Alle Pflichtdokumente sind vollständig ✓</p>
	{/if}

	<Tabs.Root value="required" class="mt-6">
		<Tabs.List class="flex gap-1 border-b border-(--color-paper-line)">
			<Tabs.Trigger
				value="required"
				class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-(--color-ink-soft) transition-colors data-[state=active]:border-(--color-rust) data-[state=active]:text-(--color-rust)"
			>
				Pflichtdokumente
			</Tabs.Trigger>
			<Tabs.Trigger
				value="optional"
				class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-(--color-ink-soft) transition-colors data-[state=active]:border-(--color-rust) data-[state=active]:text-(--color-rust)"
			>
				Optionale Dokumente
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="required" class="mt-4 flex flex-col gap-3">
			<SelbstauskunftCard existing={findDoc('selbstauskunft')} />
			{#each requiredTypes as { type, label } (type)}
				<DocumentUploadCard {type} {label} required={true} existing={findDoc(type)} />
			{/each}
		</Tabs.Content>

		<Tabs.Content value="optional" class="mt-4 flex flex-col gap-3">
			{#each optionalTypes as { type, label } (type)}
				<DocumentUploadCard {type} {label} required={false} existing={findDoc(type)} />
			{/each}
		</Tabs.Content>
	</Tabs.Root>
</div>
