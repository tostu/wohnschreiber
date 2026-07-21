<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';
	import {
		applicationStatusLabels,
		applicationStatusOrder,
		applicationStatusColorClass
	} from '$lib/application-status';

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
			<li class="ws-card flex items-center justify-between gap-4 p-4">
				<a
					href={resolve('/apply/[id]', { id: app.id })}
					class="flex min-w-0 flex-1 items-center justify-between gap-4 transition-colors hover:text-(--color-rust)"
				>
					<span class="truncate font-medium">{app.listingTitle}</span>
					<span class="shrink-0 text-sm text-(--color-ink-faint)"
						>{new Date(app.createdAt).toLocaleDateString('de-DE')}</span
					>
				</a>

				{#if app.listingUrl}
					<a
						href={app.listingUrl}
						target="_blank"
						rel="noopener noreferrer"
						title="Anzeige öffnen"
						class="shrink-0 text-(--color-ink-faint) transition-colors hover:text-(--color-rust)"
						onclick={(e) => e.stopPropagation()}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-4"
						>
							<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
							<path d="M15 3h6v6" />
							<path d="M10 14 21 3" />
						</svg>
					</a>
				{/if}

				<form
					method="POST"
					action="?/updateStatus"
					use:enhance
					class="shrink-0"
					data-status={app.status}
				>
					<input type="hidden" name="id" value={app.id} />
					<select
						name="status"
						value={app.status}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
						class="ws-status-select {applicationStatusColorClass[
							app.status
						]} rounded-full border-0 px-3 py-1 text-xs font-medium"
					>
						{#each applicationStatusOrder as status (status)}
							<option value={status}>{applicationStatusLabels[status]}</option>
						{/each}
					</select>
				</form>

				<form method="POST" action="?/delete" use:enhance class="shrink-0">
					<input type="hidden" name="id" value={app.id} />
					<button
						type="submit"
						class="text-sm text-(--color-ink-faint) transition-colors hover:text-(--color-rust-strong)"
						onclick={(e) => {
							if (!confirm('Bewerbung wirklich löschen?')) e.preventDefault();
						}}
					>
						Löschen
					</button>
				</form>
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
