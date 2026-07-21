<script lang="ts">
	import { enhance } from '$app/forms';
	import { Tabs } from 'bits-ui';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let mode = $state<'signIn' | 'signUp'>((form?.mode as 'signIn' | 'signUp') ?? 'signIn');
	let submitting = $state(false);
</script>

<div class="ws-shell flex min-h-[80vh] flex-col justify-center">
	<div class="mx-auto w-full max-w-sm">
		<div class="text-center">
			<span class="ws-eyebrow">Wohnschreiber</span>
			<h1 class="ws-title mt-2 text-3xl">
				{mode === 'signIn' ? 'Willkommen zurück' : 'Konto erstellen'}
			</h1>
		</div>

		<Tabs.Root bind:value={mode} class="mt-8">
			<Tabs.List class="flex gap-1 border-b border-(--color-paper-line)">
				<Tabs.Trigger
					value="signIn"
					class="flex-1 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-(--color-ink-soft) transition-colors data-[state=active]:border-(--color-rust) data-[state=active]:text-(--color-rust)"
				>
					Anmelden
				</Tabs.Trigger>
				<Tabs.Trigger
					value="signUp"
					class="flex-1 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-(--color-ink-soft) transition-colors data-[state=active]:border-(--color-rust) data-[state=active]:text-(--color-rust)"
				>
					Registrieren
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="signIn" class="ws-card mt-6 p-6">
				<form
					method="post"
					action="?/signInEmail"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
					class="flex flex-col gap-4"
				>
					<label class="flex flex-col gap-1.5">
						<span class="ws-label">E-Mail</span>
						<input type="email" name="email" required autocomplete="email" class="ws-input" />
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="ws-label">Passwort</span>
						<input
							type="password"
							name="password"
							required
							autocomplete="current-password"
							class="ws-input"
						/>
					</label>
					<button disabled={submitting} class="ws-btn ws-btn-primary mt-1 w-full">
						{#if submitting}
							<span class="ws-spinner"></span> Meldet an…
						{:else}
							Anmelden
						{/if}
					</button>
					{#if form?.message && form.mode === 'signIn'}
						<p class="ws-alert ws-alert-error">{form.message}</p>
					{/if}
				</form>
			</Tabs.Content>

			<Tabs.Content value="signUp" class="ws-card mt-6 p-6">
				<form
					method="post"
					action="?/signUpEmail"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
					class="flex flex-col gap-4"
				>
					<label class="flex flex-col gap-1.5">
						<span class="ws-label">Name</span>
						<input name="name" required autocomplete="name" class="ws-input" />
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="ws-label">E-Mail</span>
						<input type="email" name="email" required autocomplete="email" class="ws-input" />
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="ws-label">Passwort</span>
						<input
							type="password"
							name="password"
							required
							minlength="8"
							autocomplete="new-password"
							class="ws-input"
						/>
					</label>
					<button disabled={submitting} class="ws-btn ws-btn-primary mt-1 w-full">
						{#if submitting}
							<span class="ws-spinner"></span> Erstellt Konto…
						{:else}
							Konto erstellen
						{/if}
					</button>
					{#if form?.message && form.mode === 'signUp'}
						<p class="ws-alert ws-alert-error">{form.message}</p>
					{/if}
				</form>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
