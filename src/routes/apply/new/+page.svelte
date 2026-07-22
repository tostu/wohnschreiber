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
	let contactName = $state('');
	let description = $state('');
	let selectedDocumentIds = $state<string[]>([]);
	let extracting = $state(false);
	let generating = $state(false);
	let coverTemplate = $state('none');
	let coverFont = $state('serif');

	const coverTemplates = [
		{ value: 'none', label: 'Kein Deckblatt' },
		{ value: 'classic-centered', label: 'Klassisch (zentriert)' }
	];

	const coverFonts = [
		{ value: 'serif', label: 'Serif (Times)' },
		{ value: 'sans', label: 'Serifenlos (Helvetica)' }
	];

	$effect(() => {
		if (form && 'extracted' in form && form.extracted) {
			title = form.extracted.title;
			rent = form.extracted.rent ? String(form.extracted.rent) : '';
			address = form.extracted.address ?? '';
			contactName = form.extracted.contactName ?? '';
			description = form.extracted.description;
		}
	});

	function toggleDocument(id: string, checked: boolean) {
		selectedDocumentIds = checked
			? [...selectedDocumentIds, id]
			: selectedDocumentIds.filter((d) => d !== id);
	}
</script>

<div class="ws-shell">
	<span class="ws-eyebrow">Schritt 3</span>
	<h1 class="ws-title mt-2">Neue Bewerbung</h1>
	<p class="ws-subtitle">Verlinke die Anzeige, wähle deine Dokumente — wir schreiben den Rest.</p>

	{#if !data.profile}
		<p class="ws-alert ws-alert-info mt-6">
			Bitte fülle zuerst <a href={resolve('/profile')} class="font-semibold underline"
				>deine Bewerberdaten</a
			> aus.
		</p>
	{/if}

	<section class="ws-card mt-8 p-6">
		<h2 class="text-sm font-semibold text-(--color-ink-soft)">
			1 · WG-Gesucht-Anzeige <span class="font-normal">(optional)</span>
		</h2>
		<form
			method="post"
			action="?/extract"
			use:enhance={() => {
				extracting = true;
				return async ({ update }) => {
					await update({ reset: false });
					extracting = false;
				};
			}}
			class="mt-3 flex flex-col gap-2 sm:flex-row"
		>
			<input
				name="url"
				bind:value={url}
				placeholder="https://www.wg-gesucht.de/…"
				class="ws-input flex-1"
			/>
			<button disabled={extracting} class="ws-btn ws-btn-secondary shrink-0">
				{#if extracting}
					<span class="ws-spinner"></span> Lädt…
				{:else}
					Anzeige laden
				{/if}
			</button>
		</form>
		{#if form && 'message' in form && form.message}
			<p class="ws-alert ws-alert-info mt-3">{form.message}</p>
		{/if}
	</section>

	<section class="ws-card mt-4 p-6">
		<h2 class="text-sm font-semibold text-(--color-ink-soft)">2 · Details der Anzeige</h2>

		<form
			method="post"
			action="?/generate"
			use:enhance={() => {
				generating = true;
				return async ({ update }) => {
					await update();
					generating = false;
				};
			}}
			class="mt-3 flex flex-col gap-5"
		>
			<input type="hidden" name="sourceUrl" value={url} />

			<label class="flex flex-col gap-1.5">
				<span class="ws-label">Titel</span>
				<input name="title" required bind:value={title} class="ws-input" />
			</label>

			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5">
					<span class="ws-label"
						>Miete (€) <span class="font-normal text-(--color-ink-faint)">optional</span></span
					>
					<input type="number" name="rent" bind:value={rent} class="ws-input" />
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="ws-label"
						>Adresse / Lage <span class="font-normal text-(--color-ink-faint)">optional</span></span
					>
					<input name="address" bind:value={address} class="ws-input" />
				</label>
			</div>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label"
					>Ansprechpartner <span class="font-normal text-(--color-ink-faint)"
						>optional, für die Anrede</span
					></span
				>
				<input name="contactName" bind:value={contactName} class="ws-input" />
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label">Beschreibung</span>
				<textarea
					name="description"
					required
					rows="6"
					bind:value={description}
					placeholder="Falls das automatische Auslesen nicht geklappt hat: Text der Anzeige hier einfügen."
					class="ws-input resize-none"></textarea>
			</label>

			<div class="border-t border-(--color-paper-line) pt-5">
				<h2 class="text-sm font-semibold text-(--color-ink-soft)">3 · Deckblatt</h2>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each coverTemplates as t (t.value)}
						<label
							class="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {coverTemplate ===
							t.value
								? 'border-(--color-rust) bg-(--color-rust)/10'
								: 'border-(--color-paper-line)'}"
						>
							<input
								type="radio"
								name="coverTemplate"
								value={t.value}
								bind:group={coverTemplate}
								class="accent-(--color-rust)"
							/>
							{t.label}
						</label>
					{/each}
				</div>
				{#if coverTemplate === 'classic-centered' && !data.profile?.portraitPath}
					<p class="mt-2 text-sm text-(--color-ink-faint)">
						Kein Portrait im <a href={resolve('/profile')} class="underline">Profil</a> hinterlegt —
						das Deckblatt wird ohne Foto erstellt.
					</p>
				{/if}
				{#if coverTemplate !== 'none'}
					<div class="mt-4">
						<span class="ws-label">Schriftart</span>
						<div class="mt-2 flex flex-wrap gap-2">
							{#each coverFonts as f (f.value)}
								<label
									class="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors {coverFont ===
									f.value
										? 'border-(--color-rust) bg-(--color-rust)/10'
										: 'border-(--color-paper-line)'}"
								>
									<input
										type="radio"
										name="coverFont"
										value={f.value}
										bind:group={coverFont}
										class="accent-(--color-rust)"
									/>
									{f.label}
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="border-t border-(--color-paper-line) pt-5">
				<h2 class="text-sm font-semibold text-(--color-ink-soft)">4 · Dokumente auswählen</h2>
				<div class="mt-3 flex flex-col gap-2">
					{#each data.documents as doc (doc.id)}
						<label
							class="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-(--color-paper-line)/40"
						>
							<Checkbox.Root
								checked={selectedDocumentIds.includes(doc.id)}
								onCheckedChange={(checked) => toggleDocument(doc.id, checked === true)}
								class="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-(--color-paper-line) bg-(--color-paper-raised) transition-colors data-[state=checked]:border-(--color-rust) data-[state=checked]:bg-(--color-rust)"
							>
								{#snippet children({ checked })}
									{#if checked}
										<svg
											class="h-3 w-3 text-(--color-paper-raised)"
											viewBox="0 0 12 12"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path d="M2 6.2 4.8 9 10 3" />
										</svg>
									{/if}
								{/snippet}
							</Checkbox.Root>
							{#if selectedDocumentIds.includes(doc.id)}
								<input type="hidden" name="documentIds" value={doc.id} />
							{/if}
							<span class="text-(--color-ink-soft)">{doc.type}</span>
							<span class="truncate text-(--color-ink-faint)">— {doc.fileName}</span>
						</label>
					{:else}
						<p class="text-sm text-(--color-ink-faint)">
							Noch keine Dokumente hochgeladen. <a
								href={resolve('/documents')}
								class="font-medium text-(--color-rust) underline">Jetzt hochladen</a
							>.
						</p>
					{/each}
				</div>
			</div>

			<div class="flex items-center gap-3">
				<button disabled={generating} class="ws-btn ws-btn-primary">
					{#if generating}
						<span class="ws-spinner"></span> Generiere Anschreiben…
					{:else}
						Anschreiben generieren
					{/if}
				</button>

				{#if form && 'message' in form && form.message && !('extractionFailed' in form)}
					<p class="ws-alert ws-alert-error px-3 py-1.5">{form.message}</p>
				{/if}
			</div>
		</form>
	</section>
</div>
