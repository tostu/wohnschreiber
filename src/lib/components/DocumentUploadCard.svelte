<script lang="ts">
	import { enhance } from '$app/forms';
	import { Dialog } from 'bits-ui';

	let {
		type,
		label,
		required,
		existing
	}: {
		type: string;
		label: string;
		required: boolean;
		existing?: { id: string; fileName: string; uploadedAt: Date } | null;
	} = $props();

	let dialogOpen = $state(false);
	let uploading = $state(false);
	let deleting = $state(false);
</script>

<div class="ws-card flex flex-col gap-3 p-4">
	<div class="flex items-center justify-between gap-2">
		<h3 class="text-sm font-semibold">{label}</h3>
		<span class={required ? 'ws-badge ws-badge-required' : 'ws-badge ws-badge-optional'}>
			{required ? 'Pflicht' : 'Optional'}
		</span>
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
			<span class="truncate">{existing.fileName}</span>
		</p>
	{:else}
		<p class="text-sm text-(--color-ink-faint)">Noch nicht hochgeladen.</p>
	{/if}

	<div class="flex items-center gap-3">
		<form
			method="post"
			action="?/upload"
			enctype="multipart/form-data"
			use:enhance={() => {
				uploading = true;
				return async ({ update }) => {
					await update();
					uploading = false;
				};
			}}
			class="flex flex-1 items-center gap-2"
		>
			<input type="hidden" name="type" value={type} />
			<input
				type="file"
				name="file"
				accept=".pdf,.jpg,.jpeg,.png"
				required
				disabled={uploading}
				class="min-w-0 flex-1 text-xs text-(--color-ink-soft) file:mr-2 file:rounded-md file:border-0 file:bg-(--color-paper-line) file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-(--color-ink)"
			/>
			<button disabled={uploading} class="ws-btn ws-btn-secondary shrink-0 px-3 py-1.5 text-xs">
				{#if uploading}
					<span class="ws-spinner"></span>
				{:else}
					{existing ? 'Ersetzen' : 'Hochladen'}
				{/if}
			</button>
		</form>

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
						<Dialog.Title class="text-sm font-semibold">Dokument löschen?</Dialog.Title>
						<Dialog.Description class="mt-1 text-sm text-(--color-ink-soft)">
							„{existing.fileName}" wird endgültig entfernt.
						</Dialog.Description>
						<div class="mt-4 flex justify-end gap-2">
							<Dialog.Close class="ws-btn ws-btn-secondary px-3 py-1.5 text-xs">
								Abbrechen
							</Dialog.Close>
							<form
								method="post"
								action="?/delete"
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
