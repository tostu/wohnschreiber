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

<div class="mx-auto max-w-2xl px-4 py-10">
	<h1 class="text-2xl font-semibold">Deine Bewerbung ist fertig</h1>
	<p class="mt-1 text-sm text-gray-500">für „{data.application.listingTitle}"</p>

	<section class="mt-6 rounded-lg border border-gray-200 p-4">
		<h2 class="font-medium">Kontaktnachricht für WG-Gesucht</h2>
		<p class="mt-2 text-sm whitespace-pre-wrap text-gray-700">
			{data.application.generatedMessage}
		</p>
		<button
			onclick={copyMessage}
			class="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
		>
			{copied ? 'Kopiert ✓' : 'Text kopieren'}
		</button>
	</section>

	<section class="mt-6 rounded-lg border border-gray-200 p-4">
		<h2 class="font-medium">Anhang</h2>
		<p class="mt-1 text-sm text-gray-500">
			Anschreiben + deine ausgewählten Dokumente als eine PDF, zum Anhängen an die Kontaktnachricht.
		</p>
		<a
			href={resolve('/apply/[id]/pdf', { id: data.application.id })}
			class="mt-3 inline-block rounded-md bg-gray-800 px-4 py-2 text-sm text-white transition hover:bg-gray-900"
		>
			PDF herunterladen
		</a>
	</section>

	<a href={resolve('/apply/new')} class="mt-6 inline-block text-sm text-blue-600 underline"
		>Weitere Bewerbung erstellen</a
	>
</div>
