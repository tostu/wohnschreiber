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
</script>

<div class="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
	<div class="flex items-center justify-between">
		<h3 class="font-medium">{label}</h3>
		<span
			class="rounded-full px-2 py-0.5 text-xs {required
				? 'bg-amber-100 text-amber-800'
				: 'bg-gray-100 text-gray-500'}"
		>
			{required ? 'Pflicht' : 'Optional'}
		</span>
	</div>

	{#if existing}
		<p class="truncate text-sm text-gray-600">📄 {existing.fileName}</p>
	{:else}
		<p class="text-sm text-gray-400">Noch nicht hochgeladen.</p>
	{/if}

	<form
		method="post"
		action="?/upload"
		enctype="multipart/form-data"
		use:enhance
		class="flex items-center gap-2"
	>
		<input type="hidden" name="type" value={type} />
		<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required class="text-sm" />
		<button
			class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700"
		>
			{existing ? 'Ersetzen' : 'Hochladen'}
		</button>
	</form>

	{#if existing}
		<Dialog.Root bind:open={dialogOpen}>
			<Dialog.Trigger
				class="self-start text-sm text-red-600 underline decoration-dotted hover:text-red-700"
			>
				Löschen
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 bg-black/40" />
				<Dialog.Content
					class="fixed top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-5 shadow-xl"
				>
					<Dialog.Title class="font-medium">Dokument löschen?</Dialog.Title>
					<Dialog.Description class="mt-1 text-sm text-gray-500">
						„{existing.fileName}" wird endgültig entfernt.
					</Dialog.Description>
					<div class="mt-4 flex justify-end gap-2">
						<Dialog.Close class="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
							Abbrechen
						</Dialog.Close>
						<form
							method="post"
							action="?/delete"
							use:enhance={() => {
								dialogOpen = false;
							}}
						>
							<input type="hidden" name="id" value={existing.id} />
							<button class="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
								Löschen
							</button>
						</form>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	{/if}
</div>
