import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/auth-guard';
import { db } from '$lib/server/db';
import {
	document,
	profile,
	listing,
	application,
	applicationDocument,
	coverTemplateValues,
	coverFontValues,
	type CoverTemplate,
	type CoverFont
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { fetchListingInfo } from '$lib/server/listing-scraper';
import {
	generateCoverLetter,
	detectClarifyingQuestions,
	type ClarifyingAnswer
} from '$lib/server/mistral';
import { buildApplicationPdf, type CoverPageData } from '$lib/server/pdf';
import { readFile, saveGeneratedFile } from '$lib/server/storage';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	const [userProfile] = await db.select().from(profile).where(eq(profile.userId, user.id));
	const docs = await db.select().from(document).where(eq(document.userId, user.id));
	return { profile: userProfile ?? null, documents: docs };
};

async function runGeneration(userId: string, applicationId: string) {
	const [row] = await db
		.select()
		.from(application)
		.innerJoin(listing, eq(application.listingId, listing.id))
		.where(and(eq(application.id, applicationId), eq(application.userId, userId)));

	if (!row) {
		throw new Error('Bewerbung nicht gefunden.');
	}

	const [userProfile] = await db.select().from(profile).where(eq(profile.userId, userId));
	if (!userProfile) {
		throw new Error('Bitte zuerst deine Bewerberdaten unter /profile ausfüllen.');
	}

	const answers: ClarifyingAnswer[] = row.application.clarifyingAnswers
		? JSON.parse(row.application.clarifyingAnswers)
		: [];

	const generated = await generateCoverLetter({
		profile: {
			fullName: userProfile.fullName,
			occupation: userProfile.occupation,
			moveInEarliest: userProfile.moveInEarliest,
			householdSize: userProfile.householdSize,
			monthlyNetIncome: userProfile.monthlyNetIncome,
			aboutMe: userProfile.aboutMe
		},
		listing: {
			title: row.listing.title,
			rent: row.listing.rent,
			address: row.listing.address,
			description: row.listing.description,
			contactName: row.listing.contactName
		},
		answers
	});

	await db
		.update(application)
		.set({ generatedMessage: generated.chatMessage, coverLetterText: generated.letter })
		.where(eq(application.id, applicationId));

	return { chatMessage: generated.chatMessage, letter: generated.letter };
}

export const actions: Actions = {
	extract: async (event) => {
		requireUser(event);
		const formData = await event.request.formData();
		const url = formData.get('url')?.toString().trim();

		if (!url) {
			return { extracted: null };
		}

		const info = await fetchListingInfo(url);
		if (!info) {
			return fail(200, {
				extractionFailed: true,
				url,
				message:
					'Anzeige konnte nicht automatisch ausgelesen werden. Bitte Details manuell ausfüllen.'
			});
		}

		return { extracted: { ...info, url } };
	},

	detectQuestions: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();

		const [userProfile] = await db.select().from(profile).where(eq(profile.userId, user.id));
		if (!userProfile) {
			return fail(400, { message: 'Bitte zuerst deine Bewerberdaten unter /profile ausfüllen.' });
		}

		const title = formData.get('title')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() ?? '';
		const sourceUrl = formData.get('sourceUrl')?.toString().trim() || null;
		const rentRaw = formData.get('rent')?.toString().trim();
		const rent = rentRaw ? parseInt(rentRaw, 10) : null;
		const address = formData.get('address')?.toString().trim() || null;
		const contactName = formData.get('contactName')?.toString().trim() || null;
		const selectedDocumentIds = formData.getAll('documentIds').map((v) => v.toString());
		const coverTemplateRaw = formData.get('coverTemplate')?.toString();
		const coverTemplate: CoverTemplate = coverTemplateValues.includes(
			coverTemplateRaw as CoverTemplate
		)
			? (coverTemplateRaw as CoverTemplate)
			: 'none';
		const coverFontRaw = formData.get('coverFont')?.toString();
		const coverFont: CoverFont = coverFontValues.includes(coverFontRaw as CoverFont)
			? (coverFontRaw as CoverFont)
			: 'serif';

		if (!title || !description) {
			return fail(400, { message: 'Titel und Beschreibung der Anzeige werden benötigt.' });
		}

		const selectedDocs =
			selectedDocumentIds.length > 0
				? await db.select().from(document).where(eq(document.userId, user.id))
				: [];
		const docsToAttach = selectedDocs.filter((d) => selectedDocumentIds.includes(d.id));

		const listingId = randomUUID();
		await db.insert(listing).values({
			id: listingId,
			userId: user.id,
			sourceUrl,
			title,
			rent,
			address,
			contactName,
			description
		});

		const applicationId = randomUUID();
		await db.insert(application).values({
			id: applicationId,
			userId: user.id,
			listingId,
			coverTemplate,
			coverFont
		});

		if (docsToAttach.length > 0) {
			await db
				.insert(applicationDocument)
				.values(docsToAttach.map((d) => ({ applicationId, documentId: d.id })));
		}

		const questions = await detectClarifyingQuestions({ title, description });

		if (questions.length > 0) {
			await db
				.update(application)
				.set({ clarifyingQuestions: JSON.stringify(questions) })
				.where(eq(application.id, applicationId));

			return { applicationId, questions };
		}

		try {
			const generated = await runGeneration(user.id, applicationId);
			return { applicationId, questions: [], ...generated };
		} catch {
			return fail(502, {
				message:
					'Die Nachricht konnte nicht generiert werden (Mistral-Fehler). Bitte später erneut versuchen.'
			});
		}
	},

	submitAnswers: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();

		const applicationId = formData.get('applicationId')?.toString();
		const questionsRaw = formData.get('questions')?.toString();
		if (!applicationId || !questionsRaw) {
			return fail(400, { message: 'Ungültige Anfrage.' });
		}

		const questions: string[] = JSON.parse(questionsRaw);
		const answers: ClarifyingAnswer[] = questions.map((question, i) => ({
			question,
			answer: formData.get(`answer_${i}`)?.toString().trim() ?? ''
		}));

		await db
			.update(application)
			.set({ clarifyingAnswers: JSON.stringify(answers) })
			.where(and(eq(application.id, applicationId), eq(application.userId, user.id)));

		try {
			const generated = await runGeneration(user.id, applicationId);
			return { applicationId, questions: [], ...generated };
		} catch {
			return fail(502, {
				message:
					'Die Nachricht konnte nicht generiert werden (Mistral-Fehler). Bitte später erneut versuchen.'
			});
		}
	},

	generateText: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();
		const applicationId = formData.get('applicationId')?.toString();
		if (!applicationId) {
			return fail(400, { message: 'Ungültige Anfrage.' });
		}

		try {
			const generated = await runGeneration(user.id, applicationId);
			return { applicationId, questions: [], ...generated };
		} catch {
			return fail(502, {
				message:
					'Die Nachricht konnte nicht generiert werden (Mistral-Fehler). Bitte später erneut versuchen.'
			});
		}
	},

	finalize: async (event) => {
		const user = requireUser(event);
		const formData = await event.request.formData();

		const applicationId = formData.get('applicationId')?.toString();
		const chatMessage = formData.get('chatMessage')?.toString() ?? '';
		const coverLetterText = formData.get('coverLetterText')?.toString() ?? '';
		if (!applicationId || !coverLetterText) {
			return fail(400, { message: 'Ungültige Anfrage.' });
		}

		const [row] = await db
			.select()
			.from(application)
			.innerJoin(listing, eq(application.listingId, listing.id))
			.where(and(eq(application.id, applicationId), eq(application.userId, user.id)));

		if (!row) {
			return fail(404, { message: 'Bewerbung nicht gefunden.' });
		}

		const [userProfile] = await db.select().from(profile).where(eq(profile.userId, user.id));
		if (!userProfile) {
			return fail(400, { message: 'Bitte zuerst deine Bewerberdaten unter /profile ausfüllen.' });
		}

		const attachedDocs = await db
			.select({
				storagePath: document.storagePath,
				mimeType: document.mimeType
			})
			.from(applicationDocument)
			.innerJoin(document, eq(applicationDocument.documentId, document.id))
			.where(eq(applicationDocument.applicationId, applicationId));

		const coverTemplate = row.application.coverTemplate;
		const coverFont = row.application.coverFont;
		const address = row.listing.address;

		let portrait: CoverPageData['portrait'] = null;
		if (coverTemplate !== 'none' && userProfile.portraitPath && userProfile.portraitMimeType) {
			try {
				portrait = {
					bytes: await readFile(userProfile.portraitPath),
					mimeType: userProfile.portraitMimeType
				};
			} catch (err) {
				console.error(`portrait file missing for user ${user.id}: ${userProfile.portraitPath}`, err);
			}
		}

		const coverData: CoverPageData = {
			fullName: userProfile.fullName,
			wgAddress: address,
			street: userProfile.street,
			city: userProfile.city,
			phone: userProfile.phone,
			email: user.email,
			portrait,
			portraitOffsetX: userProfile.portraitOffsetX,
			portraitOffsetY: userProfile.portraitOffsetY
		};

		let pdfBuffer: Uint8Array;
		try {
			pdfBuffer = await buildApplicationPdf(
				coverLetterText,
				attachedDocs,
				coverTemplate,
				coverFont,
				coverData
			);
		} catch (err) {
			if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
				console.error(`attached document file missing for application ${applicationId}`, err);
				return fail(400, {
					message:
						'Ein angehängtes Dokument wurde nicht gefunden. Bitte lade die betroffenen Dokumente erneut hoch.'
				});
			}
			throw err;
		}
		const pdfPath = await saveGeneratedFile(user.id, `bewerbung-${applicationId}.pdf`, pdfBuffer);

		await db
			.update(application)
			.set({ generatedMessage: chatMessage, coverLetterText, pdfPath })
			.where(eq(application.id, applicationId));

		redirect(302, `/apply/${applicationId}`);
	}
};
