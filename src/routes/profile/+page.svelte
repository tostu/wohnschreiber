<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();
	const p = $derived(data.profile);

	let saving = $state(false);
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
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
		class="ws-card mt-8 flex flex-col gap-5 p-6"
	>
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
