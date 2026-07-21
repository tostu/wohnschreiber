<script lang="ts">
	import { Tabs } from 'bits-ui';
	import DocumentUploadCard from '$lib/components/DocumentUploadCard.svelte';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	const requiredTypes: { type: string; label: string }[] = [
		{ type: 'selbstauskunft', label: 'Selbstauskunft' },
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
</script>

<div class="mx-auto max-w-2xl px-4 py-10">
	<h1 class="text-2xl font-semibold">Deine Dokumente</h1>
	<p class="mt-1 text-sm text-gray-500">
		Diese Dokumente werden zusammen mit dem generierten Anschreiben zu einer PDF zusammengefügt.
	</p>

	<Tabs.Root value="required" class="mt-6">
		<Tabs.List class="flex gap-2 border-b border-gray-200">
			<Tabs.Trigger
				value="required"
				class="px-3 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
			>
				Pflichtdokumente
			</Tabs.Trigger>
			<Tabs.Trigger
				value="optional"
				class="px-3 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
			>
				Optionale Dokumente
			</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="required" class="mt-4 flex flex-col gap-3">
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
