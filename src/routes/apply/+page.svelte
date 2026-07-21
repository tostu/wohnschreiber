<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="mx-auto max-w-2xl px-4 py-10">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Deine Bewerbungen</h1>
		<a
			href={resolve('/apply/new')}
			class="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
			>Neue Bewerbung</a
		>
	</div>

	<ul class="mt-6 flex flex-col gap-2">
		{#each data.applications as app (app.id)}
			<li>
				<a
					href={resolve('/apply/[id]', { id: app.id })}
					class="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-blue-400"
				>
					<span>{app.listingTitle}</span>
					<span class="text-sm text-gray-400"
						>{new Date(app.createdAt).toLocaleDateString('de-DE')}</span
					>
				</a>
			</li>
		{:else}
			<p class="text-sm text-gray-400">
				Noch keine Bewerbungen. <a href={resolve('/apply/new')} class="underline">Jetzt starten</a>.
			</p>
		{/each}
	</ul>
</div>
