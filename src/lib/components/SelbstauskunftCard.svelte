<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';

	let {
		existing
	}: {
		existing?: { id: string; uploadedAt: Date } | null;
	} = $props();

	let dialogOpen = $state(false);
	let deleting = $state(false);
</script>

<div class="ws-card flex flex-col gap-3 p-4">
	<div class="flex items-center justify-between gap-2">
		<h3 class="text-sm font-semibold">Selbstauskunft</h3>
		<span class="ws-badge ws-badge-required">Pflicht</span>
	</div>

	{#if existing}
		<p class="flex items-center gap-1.5 truncate text-sm text-(--color-ink-soft)">
			<svg
				class="h-3.5 w-3.5 shrink-0"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.4"
			>
				<path d="M4 1.5h5.5L12.5 4.5V14.5h-8.5z" />
				<path d="M9 1.5V5h3" />
			</svg>
			<span class="truncate"
				>Ausgefüllt am {existing.uploadedAt.toLocaleDateString('de-DE')}</span
			>
		</p>
	{:else}
		<p class="text-sm text-(--color-ink-faint)">Noch nicht ausgefüllt.</p>
	{/if}

	<div class="flex items-center gap-3">
		<a href="/documents/selbstauskunft" class="ws-btn ws-btn-secondary px-3 py-1.5 text-xs">
			{existing ? 'Bearbeiten' : 'Ausfüllen'}
		</a>

		{#if existing}
			<Dialog.Root bind:open={dialogOpen}>
				<Dialog.Trigger class="ws-btn ws-btn-ghost shrink-0 px-2 py-1.5 text-xs">
					Löschen
				</Dialog.Trigger>
				<Dialog.Portal>
					<Dialog.Overlay class="fixed inset-0 bg-black/40" />
					<Dialog.Content
						class="ws-card fixed top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2 p-5 shadow-xl"
					>
						<Dialog.Title class="text-sm font-semibold">Selbstauskunft löschen?</Dialog.Title>
						<Dialog.Description class="mt-1 text-sm text-(--color-ink-soft)">
							Die ausgefüllten Angaben und das generierte Dokument werden entfernt.
						</Dialog.Description>
						<div class="mt-4 flex justify-end gap-2">
							<Dialog.Close class="ws-btn ws-btn-secondary px-3 py-1.5 text-xs">
								Abbrechen
							</Dialog.Close>
							<form
								method="post"
								action="/documents?/delete"
								use:enhance={() => {
									deleting = true;
									return async ({ update }) => {
										await update();
										deleting = false;
										dialogOpen = false;
									};
								}}
							>
								<input type="hidden" name="id" value={existing.id} />
								<button
									disabled={deleting}
									class="ws-btn px-3 py-1.5 text-xs"
									style="background-color: var(--color-rust-strong); color: var(--color-paper-raised);"
								>
									{deleting ? 'Löscht…' : 'Löschen'}
								</button>
							</form>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		{/if}
	</div>
</div>
