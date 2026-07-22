import { env } from '$env/dynamic/private';
import { Mistral } from '@mistralai/mistralai';

let client: Mistral | undefined;

function getClient(): Mistral {
	if (!client) {
		client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
	}
	return client;
}

export interface ApplicantProfile {
	fullName: string;
	occupation: string;
	moveInEarliest: string;
	householdSize: number;
	monthlyNetIncome: number | null;
	aboutMe: string | null;
}

export interface ListingInfo {
	title: string;
	rent: number | null;
	address: string | null;
	description: string;
	contactName: string | null;
}

export async function generateCoverLetter(params: {
	profile: ApplicantProfile;
	listing: ListingInfo;
}): Promise<string> {
	const { profile, listing } = params;

	const systemPrompt = `Du bist ein Assistent, der Bewerbern beim Verfassen von Kontaktnachrichten für Wohnungs-/WG-Anzeigen auf wg-gesucht.de hilft.
Schreibe ein prägnantes, authentisches, freundlich-professionelles Anschreiben auf Deutsch (ca. 200-230 Wörter), das direkt als Kontaktnachricht verschickt werden kann.
Gehe konkret auf Details der Anzeige ein, wirke nicht wie eine Massenbewerbung, vermeide Floskeln, und erwähne, dass Bewerbungsunterlagen (Selbstauskunft, Nachweise) im Anhang beigefügt sind.
Gliedere den Fließtext in 2-3 inhaltliche Absätze (z. B. Vorstellung, warum du passt, Rahmenbedingungen/Einzug) und trenne die Absätze durch eine Leerzeile (doppelten Zeilenumbruch).
Nach der Anrede (z. B. "Hallo ${listing.contactName ?? ''},") muss ein Zeilenumbruch folgen, bevor der Fließtext beginnt.
Beende den Text mit einer eigenen Grußzeile, z. B. "Viele Grüße," gefolgt vom Vornamen des Bewerbers in einer neuen Zeile.
Gib ausschließlich den Nachrichtentext zurück, ohne Anrede-Platzhalter wie "[Name einfügen]" und ohne Erklärungen drumherum.
Verwende keinen Gedankenstrich (–, —) im Text, auch nicht als Satzzeichen zur Abtrennung von Nebensätzen.
${listing.contactName ? `Verwende in der Anrede den Namen des Ansprechpartners ("${listing.contactName}"), z. B. "Hallo ${listing.contactName},". Falls der Name eher wie Initialen als ein echter Vorname wirkt, verwende stattdessen eine neutrale Anrede wie "Hallo,".` : 'Verwende eine neutrale Anrede wie "Hallo,", da kein Name des Ansprechpartners bekannt ist.'}`;

	const userPrompt = `Anzeige:
Titel: ${listing.title}
${listing.rent ? `Miete: ${listing.rent} €\n` : ''}${listing.address ? `Adresse/Lage: ${listing.address}\n` : ''}${listing.contactName ? `Ansprechpartner: ${listing.contactName}\n` : ''}Beschreibung: ${listing.description}

Bewerber:
Name: ${profile.fullName}
Beruf/Tätigkeit: ${profile.occupation}
Frühester Einzug: ${profile.moveInEarliest}
Haushaltsgröße: ${profile.householdSize}
${profile.monthlyNetIncome ? `Monatliches Nettoeinkommen: ${profile.monthlyNetIncome} €\n` : ''}${profile.aboutMe ? `Über mich: ${profile.aboutMe}\n` : ''}
Verfasse jetzt die Kontaktnachricht.`;

	const response = await getClient().chat.complete({
		model: 'mistral-large-latest',
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		]
	});

	const content = response.choices?.[0]?.message?.content;
	if (typeof content !== 'string' || !content.trim()) {
		throw new Error('Mistral hat keinen Nachrichtentext geliefert.');
	}

	const firstName = profile.fullName.trim().split(/\s+/)[0] ?? '';
	let result = stripDashes(content.trim());
	result = ensureGreetingLineBreak(result);
	result = ensureSignOff(result, firstName);
	result = ensureParagraphBreaks(result);
	return result;
}

/** KI ignoriert Prompt-Verbot manchmal. Ersetz Gedankenstrich hart durch Komma. */
function stripDashes(text: string): string {
	return text
		.replace(/\s*[–—]\s*/g, ', ')
		.replace(/,\s*,/g, ',')
		.replace(/ {2,}/g, ' ');
}

/** KI vergisst Zeilenumbruch nach Anrede manchmal, erzwing ihn hart. */
function ensureGreetingLineBreak(text: string): string {
	const newlineIndex = text.indexOf('\n');
	const greeting = newlineIndex === -1 ? text : text.slice(0, newlineIndex);
	const rest = newlineIndex === -1 ? '' : text.slice(newlineIndex + 1);

	if (!/^(hallo|hi|liebe|lieber|guten tag|sehr geehrte)/i.test(greeting.trim())) {
		return text;
	}

	return `${greeting}\n\n${rest.replace(/^\n+/, '')}`;
}

const SIGN_OFF_PATTERN = /^(viele\s+)?gr[üu]([ßs]e?)?,?$/i;
const COMBINED_SIGN_OFF_PATTERN = /^((?:viele\s+)?gr[üu][ßs]e?),\s*(.+)$/i;

/** KI lässt Grußzeile manchmal ganz weg, häng sie notfalls hart an. */
function ensureSignOff(text: string, firstName: string): string {
	let lines = text.split('\n');

	// KI schreibt Gruß+Name manchmal in einer Zeile ("Viele Grüße, Max"), hart splitten.
	const lastNonEmptyIdx = lines.map((line) => line.trim()).findLastIndex((line) => line.length > 0);
	if (lastNonEmptyIdx !== -1) {
		const combinedMatch = lines[lastNonEmptyIdx].trim().match(COMBINED_SIGN_OFF_PATTERN);
		if (combinedMatch) {
			lines = [
				...lines.slice(0, lastNonEmptyIdx),
				`${combinedMatch[1]},`,
				combinedMatch[2],
				...lines.slice(lastNonEmptyIdx + 1)
			];
		}
	}
	text = lines.join('\n');

	const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
	const lastLine = nonEmptyLines.at(-1)?.trim() ?? '';
	const secondLastLine = nonEmptyLines.at(-2)?.trim() ?? '';

	const hasSignOff =
		SIGN_OFF_PATTERN.test(secondLastLine) ||
		(lastLine.length > 0 && lastLine.length < 40 && SIGN_OFF_PATTERN.test(lastLine));

	if (hasSignOff) {
		return text;
	}

	return `${text.replace(/\s+$/, '')}\n\nViele Grüße,\n${firstName}`;
}

/** KI liefert Fließtext manchmal als einen Block ohne Absätze, erzwing Gliederung notfalls hart. */
function ensureParagraphBreaks(text: string): string {
	const lines = text.split('\n');
	const firstBlank = lines.indexOf('');
	const lastBlank = lines.lastIndexOf('');
	if (firstBlank === -1 || lastBlank === -1 || lastBlank <= firstBlank) {
		return text;
	}

	const bodyLines = lines.slice(firstBlank + 1, lastBlank);
	if (bodyLines.some((line) => line.trim() === '')) {
		// Fließtext hat schon eigene Absätze.
		return text;
	}

	const bodyText = bodyLines.join(' ').replace(/ {2,}/g, ' ').trim();
	const sentences = bodyText.match(/[^.!?]+[.!?]+(\s+|$)/g) ?? [bodyText];
	if (sentences.length < 3) {
		return text;
	}

	const paragraphCount = sentences.length >= 6 ? 3 : 2;
	const perParagraph = Math.ceil(sentences.length / paragraphCount);
	const paragraphs: string[] = [];
	for (let i = 0; i < sentences.length; i += perParagraph) {
		paragraphs.push(
			sentences
				.slice(i, i + perParagraph)
				.join('')
				.trim()
		);
	}

	return [...lines.slice(0, firstBlank + 1), paragraphs.join('\n\n'), ...lines.slice(lastBlank)].join(
		'\n'
	);
}
