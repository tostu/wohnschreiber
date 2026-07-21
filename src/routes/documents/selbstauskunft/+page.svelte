<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData, ActionData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();
	const a = $derived(data.answers as Record<string, unknown> | undefined);

	function str(key: string): string {
		const v = a?.[key];
		return typeof v === 'string' ? v : '';
	}
	function num(key: string): string {
		const v = a?.[key];
		return typeof v === 'number' ? String(v) : '';
	}

	let saving = $state(false);

	const yesNoQuestions: { name: string; label: string }[] = [
		{ name: 'commercialUse', label: 'Benutzen Sie die neue Wohnung für gewerbliche Zwecke?' },
		{ name: 'pets', label: 'Haben Sie Haustiere (außer Kleintiere)?' },
		{ name: 'smoker', label: 'Raucher:in' }
	];

	const furtherQuestions: { name: string; label: string }[] = [
		{ name: 'guarantee', label: 'Verfügen Sie über eine Bürgschaft?' },
		{ name: 'wbs', label: 'Haben Sie einen Wohnberechtigungsschein?' },
		{ name: 'liabilityInsurance', label: 'Haben Sie eine private Haftpflichtversicherung?' },
		{
			name: 'affidavitOfAssets',
			label:
				'Haben Sie in den letzten 3 Jahren eine eidesstattliche Versicherung / Vermögensauskunft abgegeben oder erging daraus ein Haftbefehl oder ist ein Verfahren noch anhängig?'
		},
		{
			name: 'insolvency',
			label:
				'Wurde bei Ihnen in den letzten 5 Jahren ein Konkurs- oder Insolvenzverfahren eröffnet, bzw. die Eröffnung mangels Masse abgewiesen oder ist ein Verfahren derzeit noch anhängig?'
		}
	];
</script>

<div class="ws-shell">
	<span class="ws-eyebrow">Schritt 2</span>
	<h1 class="ws-title mt-2">Selbstauskunft</h1>
	<p class="ws-subtitle">
		Achtung: Bitte fülle möglichst alle Felder aus. So erhöhst du deine Chancen bei den
		Vermieter:innen deutlich.
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
		class="ws-card mt-8 flex flex-col gap-6 p-6"
	>
		<div class="flex flex-col gap-5">
			<h2 class="text-sm font-semibold">Persönliche Informationen</h2>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label">Anrede</span>
				<select name="anrede" class="ws-input" value={str('anrede') || 'keine_angabe'}>
					<option value="herr">Herr</option>
					<option value="frau">Frau</option>
					<option value="keine_angabe">Keine Angabe</option>
				</select>
			</label>

			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Geburtsdatum</span>
					<input type="date" name="birthDate" required value={str('birthDate')} class="ws-input" />
				</label>
				<div></div>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Vorname</span>
					<input name="firstName" required value={str('firstName')} class="ws-input" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Nachname</span>
					<input name="lastName" required value={str('lastName')} class="ws-input" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Straße & Hausnummer</span>
					<input name="street" required value={str('street')} class="ws-input" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Stadt</span>
					<input name="city" required value={str('city')} class="ws-input" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">Telefon (Handy)</span>
					<input name="phone" required value={str('phone')} class="ws-input" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label">E-Mail-Adresse</span>
					<input type="email" name="email" required value={str('email')} class="ws-input" />
				</label>
			</div>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label"
					>Über mich/uns <span class="font-normal text-(--color-ink-faint)">(optional)</span
					></span
				>
				<textarea name="aboutMe" rows="4" class="ws-input resize-none">{str('aboutMe')}</textarea>
			</label>
		</div>

		<div class="flex flex-col gap-5 border-t border-(--color-paper-line) pt-5">
			<h2 class="text-sm font-semibold">Berufliche Informationen</h2>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label">Beruflicher Status</span>
				<select name="occupationStatus" required class="ws-input" value={str('occupationStatus')}>
					<option value="">Bitte wählen</option>
					<option value="Student(in)">Student(in)</option>
					<option value="Angestellte(r)">Angestellte(r)</option>
					<option value="Selbstständig">Selbstständig</option>
					<option value="Beamte(r)">Beamte(r)</option>
					<option value="Auszubildende(r)">Auszubildende(r)</option>
					<option value="Rentner(in)">Rentner(in)</option>
					<option value="Sonstiges">Sonstiges</option>
				</select>
			</label>

			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5">
					<span class="ws-label"
						>Berufsbezeichnung <span class="font-normal text-(--color-ink-faint)">(optional)</span
						></span
					>
					<input name="jobTitle" value={str('jobTitle')} class="ws-input" />
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="ws-label"
						>Arbeitgeber <span class="font-normal text-(--color-ink-faint)">(optional)</span></span
					>
					<input name="employer" value={str('employer')} class="ws-input" />
				</label>
			</div>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label"
					>Einkommen (€/Jahr) <span class="font-normal text-(--color-ink-faint)"
						>(optional)</span
					></span
				>
				<input type="number" min="0" name="annualIncome" value={num('annualIncome')} class="ws-input" />
			</label>
		</div>

		<div class="flex flex-col gap-5 border-t border-(--color-paper-line) pt-5">
			<h2 class="text-sm font-semibold">Wohnungsbezogene Informationen</h2>

			<label class="flex flex-col gap-1.5">
				<span class="ws-label">Warum ziehen Sie um?</span>
				<input name="moveReason" required value={str('moveReason')} class="ws-input" />
			</label>

			{#each yesNoQuestions as { name, label } (name)}
				<fieldset class="flex flex-col gap-1.5">
					<span class="ws-label">{label}</span>
					<div class="flex gap-4 text-sm">
						{#each [['ja', 'Ja'], ['nein', 'Nein'], ['keine_angabe', 'Keine Angabe']] as [value, optLabel] (value)}
							<label class="flex items-center gap-1.5">
								<input
									type="radio"
									{name}
									value={value}
									checked={(str(name) || 'keine_angabe') === value}
								/>
								{optLabel}
							</label>
						{/each}
					</div>
				</fieldset>
			{/each}
		</div>

		<div class="flex flex-col gap-5 border-t border-(--color-paper-line) pt-5">
			<h2 class="text-sm font-semibold">Weitere Angaben</h2>

			{#each furtherQuestions as { name, label } (name)}
				<fieldset class="flex flex-col gap-1.5">
					<span class="ws-label">{label}</span>
					<div class="flex gap-4 text-sm">
						{#each [['ja', 'Ja'], ['nein', 'Nein'], ['keine_angabe', 'Keine Angabe']] as [value, optLabel] (value)}
							<label class="flex items-center gap-1.5">
								<input
									type="radio"
									{name}
									value={value}
									checked={(str(name) || 'keine_angabe') === value}
								/>
								{optLabel}
							</label>
						{/each}
					</div>
				</fieldset>
			{/each}
		</div>

		<label class="flex items-start gap-2 border-t border-(--color-paper-line) pt-5 text-sm">
			<input
				type="checkbox"
				name="confirmedTruthful"
				checked={a?.confirmedTruthful === true}
				class="mt-0.5"
			/>
			<span>
				Ich erkläre, dass die vorgenannten Angaben wahrheitsgemäß gemacht wurden. Bei Abschluss
				eines Mietvertrages können Falschangaben möglicherweise die Aufhebung oder fristlose
				Kündigung des Mietverhältnisses zur Folge haben.
			</span>
		</label>

		<div class="flex items-center gap-3">
			<button disabled={saving} class="ws-btn ws-btn-primary">
				{#if saving}
					<span class="ws-spinner"></span> Speichert…
				{:else}
					Speichern
				{/if}
			</button>
			<a href="/documents" class="ws-btn ws-btn-secondary">Zurück</a>

			{#if form?.message}
				<p class="ws-alert ws-alert-error px-3 py-1.5">{form.message}</p>
			{/if}
		</div>
	</form>
</div>
