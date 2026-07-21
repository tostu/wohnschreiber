<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Checkbox } from 'bits-ui';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	let url = $state('');
	let title = $state('');
	let rent = $state('');
	let address = $state('');
	let description = $state('');
	let selectedDocumentIds = $state<string[]>([]);
	let extracting = $state(false);

	$effect(() => {
		if (form && 'extracted' in form && form.extracted) {
			title = form.extracted.title;
			rent = form.extracted.rent ? String(form.extracted.rent) : '';
			address = form.extracted.address ?? '';
			description = form.extracted.description;
		}
	});

	function toggleDocument(id: string, checked: boolean) {
		selectedDocumentIds = checked
			? [...selectedDocumentIds, id]
			: selectedDocumentIds.filter((d) => d !== id);
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-10">
	<h1 class="text-2xl font-semibold">Neue Bewerbung</h1>

	{#if !data.profile}
		<p class="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
			Bitte fülle zuerst <a href={resolve('/profile')} class="underline">deine Bewerberdaten</a> aus.
		</p>
	{/if}

	<section class="mt-6">
		<h2 class="font-medium">1. WG-Gesucht-Anzeige (optional)</h2>
		<form
			method="post"
			action="?/extract"
			use:enhance={() => {
				extracting = true;
				return async ({ update }) => {
					await update();
					extracting = false;
				};
			}}
			class="mt-2 flex gap-2"
		>
			<input
				name="url"
				bind:value={url}
				placeholder="https://www.wg-gesucht.de/..."
				class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
			<button
				disabled={extracting}
				class="rounded-md bg-gray-800 px-4 py-2 text-sm text-white transition hover:bg-gray-900 disabled:opacity-50"
			>
				{extracting ? 'Lade…' : 'Anzeige laden'}
			</button>
		</form>
		{#if form && 'message' in form && form.message}
			<p class="mt-2 text-sm text-amber-700">{form.message}</p>
		{/if}
	</section>

	<section class="mt-8">
		<h2 class="font-medium">2. Details der Anzeige</h2>
		<form method="post" action="?/generate" use:enhance class="mt-2 flex flex-col gap-4">
			<input type="hidden" name="sourceUrl" value={url} />

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Titel</span>
				<input
					name="title"
					required
					bind:value={title}
					class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Miete (€, optional)</span>
				<input
					type="number"
					name="rent"
					bind:value={rent}
					class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Adresse / Lage (optional)</span>
				<input
					name="address"
					bind:value={address}
					class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1">
				<span class="text-sm font-medium">Beschreibung</span>
				<textarea
					name="description"
					required
					rows="6"
					bind:value={description}
					placeholder="Falls das automatische Auslesen nicht geklappt hat: Text der Anzeige hier einfügen."
					class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				></textarea>
			</label>

			<div>
				<span class="text-sm font-medium">3. Dokumente auswählen</span>
				<div class="mt-2 flex flex-col gap-2">
					{#each data.documents as doc (doc.id)}
						<label class="flex items-center gap-2 text-sm">
							<Checkbox.Root
								checked={selectedDocumentIds.includes(doc.id)}
								onCheckedChange={(checked) => toggleDocument(doc.id, checked === true)}
								class="flex h-5 w-5 items-center justify-center rounded border border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
							>
								{#snippet children({ checked })}
									{#if checked}
										<span class="text-xs text-white">✓</span>
									{/if}
								{/snippet}
							</Checkbox.Root>
							{#if selectedDocumentIds.includes(doc.id)}
								<input type="hidden" name="documentIds" value={doc.id} />
							{/if}
							{doc.type} — {doc.fileName}
						</label>
					{:else}
						<p class="text-sm text-gray-400">
							Noch keine Dokumente hochgeladen. <a href={resolve('/documents')} class="underline"
								>Jetzt hochladen</a
							>.
						</p>
					{/each}
				</div>
			</div>

			<button
				class="mt-2 self-start rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
			>
				Anschreiben generieren
			</button>

			{#if form && 'message' in form && form.message && !('extractionFailed' in form)}
				<p class="text-red-500">{form.message}</p>
			{/if}
		</form>
	</section>
</div>
