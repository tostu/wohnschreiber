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

export interface GeneratedCoverLetter {
	/** Kurze Kontaktnachricht für den WG-Gesucht-Chat. */
	chatMessage: string;
	/** Ausführlicheres Anschreiben, das als PDF beigefügt wird. */
	letter: string;
}

interface CoverLetterSection {
	anrede?: unknown;
	absaetze?: unknown;
	gruss?: unknown;
}

interface CoverLetterJson {
	chat?: CoverLetterSection;
	brief?: CoverLetterSection;
}

export async function generateCoverLetter(params: {
	profile: ApplicantProfile;
	listing: ListingInfo;
}): Promise<GeneratedCoverLetter> {
	const { profile, listing } = params;

	const systemPrompt = `Du bist ein Assistent, der Bewerbern beim Verfassen von Bewerbungstexten für Wohnungs-/WG-Anzeigen auf wg-gesucht.de hilft.
Antworte ausschließlich mit einem JSON-Objekt (kein Markdown-Codeblock, keine Erklärung drumherum) mit genau diesen Feldern:
- "chat": die direkte Kontaktnachricht im WG-Gesucht-Chat, ein Objekt mit "anrede" (Anrede-Zeile, z. B. "Hallo ${listing.contactName ?? ''},"), "absaetze" (Array aus 1 kurzem String, ca. 60-90 Wörter: eine Mini-Vorstellung und ein Verweis darauf, dass die Bewerbungsunterlagen im Anhang beigefügt sind) und "gruss" (Grußformel ohne Namen, z. B. "Viele Grüße")
- "brief": das ausführlichere formelle Anschreiben, das als PDF beigefügt wird, ein Objekt mit "anrede" (inhaltlich passend zu "chat"), "absaetze" (Array aus 2-3 Strings, zusammen ca. 300-350 Wörter: Vorstellung, warum du passt, Rahmenbedingungen/Einzug) und "gruss" (Grußformel ohne Namen)

Beide Texte sollen sich inhaltlich nicht widersprechen, "chat" ist aber deutlich kürzer und knapper als "brief".
Schreibe authentisch, freundlich-professionell auf Deutsch. Gehe konkret auf Details der Anzeige ein, wirke nicht wie eine Massenbewerbung, vermeide Floskeln, und erwähne in "brief" ausdrücklich, dass Bewerbungsunterlagen (Selbstauskunft, Nachweise) im Anhang beigefügt sind.
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
Verfasse jetzt "chat" und "brief" als JSON.`;

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

	const firstName = profile.fullName.trim().split(/\s+/)[0] ?? '';
	const fallbackAnrede = listing.contactName ? `Hallo ${listing.contactName},` : 'Hallo,';

	return {
		chatMessage: assembleSection(
			parsed.chat,
			fallbackAnrede,
			firstName,
			'Mistral hat keine Kontaktnachricht geliefert.'
		),
		letter: assembleSection(
			parsed.brief,
			fallbackAnrede,
			firstName,
			'Mistral hat kein Anschreiben geliefert.'
		)
	};
}

/**
 * Baut aus den KI-Bausteinen (Anrede, Absätze, Gruß) manuell den finalen Text zusammen,
 * statt ihn per Regex aus KI-Freitext herauszupulen.
 */
function assembleSection(
	section: CoverLetterSection | undefined,
	fallbackAnrede: string,
	firstName: string,
	missingBodyError: string
): string {
	const absaetze = Array.isArray(section?.absaetze)
		? section.absaetze
				.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
				.map((p) => stripDashes(p.trim()))
		: [];
	if (absaetze.length === 0) {
		throw new Error(missingBodyError);
	}

	const anrede =
		typeof section?.anrede === 'string' && section.anrede.trim()
			? stripDashes(section.anrede.trim())
			: fallbackAnrede;

	const gruss =
		typeof section?.gruss === 'string' && section.gruss.trim()
			? stripDashes(section.gruss.trim()).replace(/,\s*$/, '')
			: 'Viele Grüße';

	return [anrede, '', absaetze.join('\n\n'), '', `${gruss},`, firstName].join('\n');
}

/** KI ignoriert Prompt-Verbot manchmal. Ersetz Gedankenstrich hart durch Komma. */
function stripDashes(text: string): string {
	return text
		.replace(/\s*[–—]\s*/g, ', ')
		.replace(/,\s*,/g, ',')
		.replace(/ {2,}/g, ' ');
}
