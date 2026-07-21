<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();
	const p = $derived(data.profile);

	let saving = $state(false);
	let portraitOffsetX = $state(p?.portraitOffsetX ?? 0);
	let portraitOffsetY = $state(p?.portraitOffsetY ?? 0);
	// object-position%: 50 = centered; offsetY 1 (show more top) → 0%, -1 (show more bottom) → 100%.
	const previewObjectPosition = $derived(
		`${50 + portraitOffsetX * 50}% ${50 - portraitOffsetY * 50}%`
	);
</script>

<div class="ws-shell">
	<span class="ws-eyebrow">Schritt 1</span>
	<h1 class="ws-title mt-2">Deine Bewerberdaten</h1>
	<p class="ws-subtitle">
		Diese Angaben werden für jedes generierte Anschreiben wiederverwendet — einmal ausfüllen, immer
		passend.
	</p>

	<form
		method="post"
		action="?/save"
		enctype="multipart/form-data"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
			};
		}}
		class="ws-card mt-8 flex flex-col gap-5 p-6"
	>
		<div class="flex items-center gap-4">
			{#if p?.portraitPath}
				<img
					src="/profile/portrait"
					alt="Portrait"
					style="object-position: {previewObjectPosition}"
					class="h-20 w-20 shrink-0 rounded-full object-cover"
				/>
			{:else}
				<div
					class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-(--color-paper-line) text-center text-xs text-(--color-ink-faint)"
				>
					Kein Foto
				</div>
			{/if}
			<label class="flex flex-1 flex-col gap-1.5">
				<span class="ws-label"
					>Portrait <span class="font-normal text-(--color-ink-faint)"
						>(optional, für das Deckblatt)</span
					></span
				>
				<input
					type="file"
					name="portrait"
					accept=".jpg,.jpeg,.png"
					class="text-xs text-(--color-ink-soft) file:mr-2 file:rounded-md file:border-0 file:bg-(--color-paper-line) file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-(--color-ink)"
				/>
			</label>
		</div>

		{#if p?.portraitPath}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Portrait horizontal</span>
					<input
						type="range"
						name="portraitOffsetX"
						min="-1"
						max="1"
						step="0.05"
						bind:value={portraitOffsetX}
						class="accent-(--color-rust)"
					/>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Portrait vertikal</span>
					<input
						type="range"
						name="portraitOffsetY"
						min="-1"
						max="1"
						step="0.05"
						bind:value={portraitOffsetY}
						class="accent-(--color-rust)"
					/>
				</label>
			</div>
		{/if}

		<label class="flex flex-col gap-1.5">
			<span class="ws-label">Vollständiger Name</span>
			<input name="fullName" required value={p?.fullName ?? ''} class="ws-input" />
		</label>

		<label class="flex flex-col gap-1.5">
			<span class="ws-label">Beruf / Tätigkeit</span>
			<input name="occupation" required value={p?.occupation ?? ''} class="ws-input" />
		</label>

		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
			<label class="flex flex-col gap-1.5">
				<span class="ws-label"
					>Straße &amp; Hausnummer <span class="font-normal text-(--color-ink-faint)"
						>(optional)</span
					></span
				>
				<input name="street" value={p?.street ?? ''} class="ws-input" />
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label"
					>PLZ &amp; Ort <span class="font-normal text-(--color-ink-faint)">(optional)</span></span
				>
				<input name="city" value={p?.city ?? ''} class="ws-input" />
			</label>
		</div>

		<label class="flex flex-col gap-1.5">
			<span class="ws-label"
				>Telefon <span class="font-normal text-(--color-ink-faint)">(optional)</span></span
			>
			<input name="phone" value={p?.phone ?? ''} class="ws-input" />
		</label>

		<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
			<label class="flex flex-col gap-1.5">
				<span class="ws-label">Frühester Einzugstermin</span>
				<input
					type="date"
					name="moveInEarliest"
					required
					value={p?.moveInEarliest ?? ''}
					class="ws-input"
				/>
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label">Haushaltsgröße</span>
				<input
					type="number"
					min="1"
					name="householdSize"
					value={p?.householdSize ?? 1}
					class="ws-input"
				/>
			</label>
		</div>

		<label class="flex flex-col gap-1.5">
			<span class="ws-label"
				>Monatliches Nettoeinkommen <span class="font-normal text-(--color-ink-faint)"
					>(optional)</span
				></span
			>
			<input
				type="number"
				min="0"
				name="monthlyNetIncome"
				value={p?.monthlyNetIncome ?? ''}
				class="ws-input"
			/>
		</label>

		<label class="flex flex-col gap-1.5">
			<span class="ws-label"
				>Über mich <span class="font-normal text-(--color-ink-faint)">(optional)</span></span
			>
			<textarea name="aboutMe" rows="4" class="ws-input resize-none">{p?.aboutMe ?? ''}</textarea>
		</label>

		<div class="mt-1 flex items-center gap-3">
			<button disabled={saving} class="ws-btn ws-btn-primary">
				{#if saving}
					<span class="ws-spinner"></span> Speichert…
				{:else}
					Speichern
				{/if}
			</button>

			{#if form?.message}
				<p class="ws-alert ws-alert-error px-3 py-1.5">{form.message}</p>
			{/if}
			{#if form?.success}
				<p class="text-sm font-medium text-(--color-sage)">Gespeichert ✓</p>
			{/if}
		</div>
	</form>
</div>
