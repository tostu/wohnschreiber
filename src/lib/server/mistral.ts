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

interface CoverLetterJson {
	anrede?: unknown;
	absaetze?: unknown;
	gruss?: unknown;
}

export async function generateCoverLetter(params: {
	profile: ApplicantProfile;
	listing: ListingInfo;
}): Promise<string> {
	const { profile, listing } = params;

	const systemPrompt = `Du bist ein Assistent, der Bewerbern beim Verfassen von Kontaktnachrichten für Wohnungs-/WG-Anzeigen auf wg-gesucht.de hilft.
Antworte ausschließlich mit einem JSON-Objekt (kein Markdown-Codeblock, keine Erklärung drumherum) mit genau diesen Feldern:
- "anrede": die Anrede-Zeile, z. B. "Hallo ${listing.contactName ?? ''},"
- "absaetze": ein Array aus 2-3 Strings, je ein inhaltlicher Absatz des Fließtexts (z. B. Vorstellung, warum du passt, Rahmenbedingungen/Einzug), zusammen ca. 300-350 Wörter
- "gruss": eine Grußformel ohne Namen, z. B. "Viele Grüße"

Schreibe prägnant, authentisch, freundlich-professionell auf Deutsch. Gehe konkret auf Details der Anzeige ein, wirke nicht wie eine Massenbewerbung, vermeide Floskeln, und erwähne, dass Bewerbungsunterlagen (Selbstauskunft, Nachweise) im Anhang beigefügt sind.
Verwende keinen Gedankenstrich (–, —) im Text, auch nicht als Satzzeichen zur Abtrennung von Nebensätzen.
Verwende in "anrede" keine Platzhalter wie "[Name einfügen]".
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
Verfasse jetzt die Kontaktnachricht als JSON.`;

	const response = await getClient().chat.complete({
		model: 'mistral-large-latest',
		responseFormat: { type: 'json_object' },
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		]
	});

	const content = response.choices?.[0]?.message?.content;
	if (typeof content !== 'string' || !content.trim()) {
		throw new Error('Mistral hat keinen Nachrichtentext geliefert.');
	}

	let parsed: CoverLetterJson;
	try {
		parsed = JSON.parse(content);
	} catch {
		throw new Error('Mistral hat kein gültiges JSON geliefert.');
	}

	const absaetze = Array.isArray(parsed.absaetze)
		? parsed.absaetze
				.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
				.map((p) => stripDashes(p.trim()))
		: [];
	if (absaetze.length === 0) {
		throw new Error('Mistral hat keinen Fließtext geliefert.');
	}

	const fallbackAnrede = listing.contactName ? `Hallo ${listing.contactName},` : 'Hallo,';
	const anrede =
		typeof parsed.anrede === 'string' && parsed.anrede.trim()
			? stripDashes(parsed.anrede.trim())
			: fallbackAnrede;

	const gruss =
		typeof parsed.gruss === 'string' && parsed.gruss.trim()
			? stripDashes(parsed.gruss.trim()).replace(/,\s*$/, '')
			: 'Viele Grüße';

	const firstName = profile.fullName.trim().split(/\s+/)[0] ?? '';

	// Anrede, Gruß und Name werden hier manuell zu Zeilen zusammengesetzt statt aus
	// KI-Freitext per Regex herausgepult zu werden — die KI liefert nur die Bausteine.
	return [anrede, '', absaetze.join('\n\n'), '', `${gruss},`, firstName].join('\n');
}

/** KI ignoriert Prompt-Verbot manchmal. Ersetz Gedankenstrich hart durch Komma. */
function stripDashes(text: string): string {
	return text
		.replace(/\s*[–—]\s*/g, ', ')
		.replace(/,\s*,/g, ',')
		.replace(/ {2,}/g, ' ');
}
