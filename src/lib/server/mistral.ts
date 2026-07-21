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
Schreibe ein ausführliches, authentisches, freundlich-professionelles Anschreiben auf Deutsch (ca. 300-400 Wörter), das direkt als Kontaktnachricht verschickt werden kann.
Gehe konkret auf Details der Anzeige ein, wirke nicht wie eine Massenbewerbung, vermeide Floskeln, und erwähne, dass Bewerbungsunterlagen (Selbstauskunft, Nachweise) im Anhang beigefügt sind.
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
	return stripDashes(content.trim());
}

/** KI ignoriert Prompt-Verbot manchmal. Ersetz Gedankenstrich hart durch Komma. */
function stripDashes(text: string): string {
	return text
		.replace(/\s*[–—]\s*/g, ', ')
		.replace(/,\s*,/g, ',')
		.replace(/ {2,}/g, ' ');
}
