<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="ws-shell">
	<div class="flex items-start justify-between gap-4">
		<div>
			<span class="ws-eyebrow">Verlauf</span>
			<h1 class="ws-title mt-2">Deine Bewerbungen</h1>
		</div>
		<a href={resolve('/apply/new')} class="ws-btn ws-btn-primary shrink-0">Neue Bewerbung</a>
	</div>

	<ul class="mt-8 flex flex-col gap-2">
		{#each data.applications as app (app.id)}
			<li>
				<a
					href={resolve('/apply/[id]', { id: app.id })}
					class="ws-card flex items-center justify-between p-4 transition-colors hover:border-(--color-rust)"
				>
					<span class="font-medium">{app.listingTitle}</span>
					<span class="text-sm text-(--color-ink-faint)"
						>{new Date(app.createdAt).toLocaleDateString('de-DE')}</span
					>
				</a>
			</li>
		{:else}
			<div class="ws-card flex flex-col items-center gap-2 p-10 text-center">
				<p class="text-sm text-(--color-ink-faint)">Noch keine Bewerbungen.</p>
				<a href={resolve('/apply/new')} class="font-medium text-(--color-rust) underline"
					>Jetzt starten</a
				>
			</div>
		{/each}
	</ul>
</div>
