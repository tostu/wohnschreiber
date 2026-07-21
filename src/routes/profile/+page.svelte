<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();
	const p = $derived(data.profile);
</script>

<div class="mx-auto max-w-xl px-4 py-10">
	<h1 class="text-2xl font-semibold">Deine Bewerberdaten</h1>
	<p class="mt-1 text-sm text-gray-500">
		Diese Angaben werden für jedes generierte Anschreiben wiederverwendet.
	</p>

	<form method="post" action="?/save" use:enhance class="mt-6 flex flex-col gap-4">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Vollständiger Name</span>
			<input
				name="fullName"
				required
				value={p?.fullName ?? ''}
				class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Beruf / Tätigkeit</span>
			<input
				name="occupation"
				required
				value={p?.occupation ?? ''}
				class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Frühester Einzugstermin</span>
			<input
				type="date"
				name="moveInEarliest"
				required
				value={p?.moveInEarliest ?? ''}
				class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Haushaltsgröße</span>
			<input
				type="number"
				min="1"
				name="householdSize"
				value={p?.householdSize ?? 1}
				class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Monatliches Nettoeinkommen (optional)</span>
			<input
				type="number"
				min="0"
				name="monthlyNetIncome"
				value={p?.monthlyNetIncome ?? ''}
				class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium">Über mich (optional)</span>
			<textarea
				name="aboutMe"
				rows="4"
				class="rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				>{p?.aboutMe ?? ''}</textarea
			>
		</label>

		<button
			class="mt-2 self-start rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
		>
			Speichern
		</button>

		{#if form?.message}
			<p class="text-red-500">{form.message}</p>
		{/if}
		{#if form?.success}
			<p class="text-green-600">Gespeichert.</p>
		{/if}
	</form>
</div>
