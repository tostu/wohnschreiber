import {
	PDFDocument,
	StandardFonts,
	rgb,
	appendBezierCurve,
	clip,
	closePath,
	endPath,
	moveTo,
	popGraphicsState,
	pushGraphicsState
} from 'pdf-lib';
import { readFile } from './storage';
import type { CoverTemplate } from './db/applications.schema';

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

/** Drops characters the standard WinAnsi-encoded font can't render (e.g. emoji). */
function sanitizeForFont(text: string, font: import('pdf-lib').PDFFont): string {
	let result = '';
	for (const char of text) {
		try {
			font.widthOfTextAtSize(char, FONT_SIZE);
			result += char;
		} catch {
			// unsupported code point (e.g. emoji): drop it
		}
	}
	return result;
}

function wrapText(text: string, font: import('pdf-lib').PDFFont, maxWidth: number): string[] {
	const lines: string[] = [];
	for (const paragraph of sanitizeForFont(text, font).split('\n')) {
		if (paragraph.trim() === '') {
			lines.push('');
			continue;
		}
		let current = '';
		for (const word of paragraph.split(' ')) {
			const candidate = current ? `${current} ${word}` : word;
			if (font.widthOfTextAtSize(candidate, FONT_SIZE) > maxWidth && current) {
				lines.push(current);
				current = word;
			} else {
				current = candidate;
			}
		}
		if (current) lines.push(current);
	}
	return lines;
}

async function addCoverLetterPages(pdf: PDFDocument, text: string) {
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const maxWidth = PAGE_WIDTH - MARGIN * 2;
	const lines = wrapText(text, font, maxWidth);

	let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	let y = PAGE_HEIGHT - MARGIN;

	for (const line of lines) {
		if (y < MARGIN) {
			page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
			y = PAGE_HEIGHT - MARGIN;
		}
		page.drawText(line, {
			x: MARGIN,
			y,
			size: FONT_SIZE,
			font,
			color: rgb(0, 0, 0)
		});
		y -= LINE_HEIGHT;
	}
}

async function appendDocument(pdf: PDFDocument, storagePath: string, mimeType: string) {
	const bytes = await readFile(storagePath);

	if (mimeType === 'application/pdf') {
		const source = await PDFDocument.load(bytes);
		const pages = await pdf.copyPages(source, source.getPageIndices());
		for (const page of pages) pdf.addPage(page);
		return;
	}

	if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
		const image = await pdf.embedJpg(bytes);
		drawImagePage(pdf, image);
		return;
	}

	if (mimeType === 'image/png') {
		const image = await pdf.embedPng(bytes);
		drawImagePage(pdf, image);
		return;
	}

	// Unsupported type: skip rather than fail the whole merge.
}

function drawImagePage(pdf: PDFDocument, image: import('pdf-lib').PDFImage) {
	const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	const maxWidth = PAGE_WIDTH - MARGIN * 2;
	const maxHeight = PAGE_HEIGHT - MARGIN * 2;
	const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
	const width = image.width * scale;
	const height = image.height * scale;
	page.drawImage(image, {
		x: (PAGE_WIDTH - width) / 2,
		y: (PAGE_HEIGHT - height) / 2,
		width,
		height
	});
}

const CIRCLE_KAPPA = 0.5522847498;

/** Clips subsequent drawing (until popGraphicsState) to a circle, using low-level path operators. */
function clipToCircle(page: import('pdf-lib').PDFPage, cx: number, cy: number, r: number) {
	const k = r * CIRCLE_KAPPA;
	page.pushOperators(
		pushGraphicsState(),
		moveTo(cx + r, cy),
		appendBezierCurve(cx + r, cy + k, cx + k, cy + r, cx, cy + r),
		appendBezierCurve(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
		appendBezierCurve(cx - r, cy - k, cx - k, cy - r, cx, cy - r),
		appendBezierCurve(cx + k, cy - r, cx + r, cy - k, cx + r, cy),
		closePath(),
		clip(),
		endPath()
	);
}

function drawCentered(
	page: import('pdf-lib').PDFPage,
	text: string,
	font: import('pdf-lib').PDFFont,
	size: number,
	y: number
) {
	const width = font.widthOfTextAtSize(text, size);
	page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font, color: rgb(0.16, 0.16, 0.16) });
}

export interface CoverPageData {
	fullName: string;
	wgTitle: string;
	wgAddress: string | null;
	street: string | null;
	city: string | null;
	phone: string | null;
	email: string;
	portrait: { bytes: Buffer; mimeType: string } | null;
}

async function buildClassicCenteredCoverPage(pdf: PDFDocument, data: CoverPageData) {
	const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	const font = await pdf.embedFont(StandardFonts.TimesRoman);
	const boldFont = await pdf.embedFont(StandardFonts.TimesRomanBold);

	let y = PAGE_HEIGHT - 180;

	if (data.portrait) {
		const radius = 100;
		const cx = PAGE_WIDTH / 2;
		const cy = y;
		const image =
			data.portrait.mimeType === 'image/png'
				? await pdf.embedPng(data.portrait.bytes)
				: await pdf.embedJpg(data.portrait.bytes);

		const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height);
		const width = image.width * scale;
		const height = image.height * scale;

		clipToCircle(page, cx, cy, radius);
		page.drawImage(image, {
			x: cx - width / 2,
			y: cy - height / 2,
			width,
			height
		});
		page.pushOperators(popGraphicsState());

		y -= radius + 40;
	} else {
		y -= 40;
	}

	drawCentered(page, data.fullName, boldFont, 28, y);
	y -= 34;
	drawCentered(page, 'Anfrage', boldFont, 16, y);
	y -= 36;

	drawCentered(page, 'für die WG:', font, 12, y);
	y -= LINE_HEIGHT;
	drawCentered(page, data.wgTitle, font, 12, y);
	y -= LINE_HEIGHT;
	if (data.wgAddress) {
		drawCentered(page, data.wgAddress, font, 12, y);
		y -= LINE_HEIGHT;
	}

	y -= LINE_HEIGHT * 3;

	if (data.street || data.city) {
		drawCentered(page, 'Anschrift', boldFont, 13, y);
		y -= LINE_HEIGHT;
		if (data.street) {
			drawCentered(page, data.street, font, 11, y);
			y -= LINE_HEIGHT;
		}
		if (data.city) {
			drawCentered(page, data.city, font, 11, y);
			y -= LINE_HEIGHT;
		}
		y -= LINE_HEIGHT * 0.5;
	}

	if (data.phone) {
		drawCentered(page, 'Telefon', boldFont, 13, y);
		y -= LINE_HEIGHT;
		drawCentered(page, data.phone, font, 11, y);
		y -= LINE_HEIGHT * 1.5;
	}

	drawCentered(page, 'E-Mail', boldFont, 13, y);
	y -= LINE_HEIGHT;
	drawCentered(page, data.email, font, 11, y);
}

export async function buildCoverPage(
	pdf: PDFDocument,
	template: CoverTemplate,
	data: CoverPageData
): Promise<void> {
	if (template === 'none') return;
	if (template === 'classic-centered') {
		await buildClassicCenteredCoverPage(pdf, data);
	}
}

const YES_NO_LABELS: Record<string, string> = {
	ja: 'Ja',
	nein: 'Nein',
	keine_angabe: 'Keine Angabe'
};

const ANREDE_LABELS: Record<string, string> = {
	herr: 'Herr',
	frau: 'Frau',
	keine_angabe: 'Keine Angabe'
};

export interface SelbstauskunftAnswers {
	anrede: string;
	birthDate: string;
	firstName: string;
	lastName: string;
	street: string;
	city: string;
	phone: string;
	email: string;
	aboutMe: string | null;
	occupationStatus: string;
	jobTitle: string | null;
	employer: string | null;
	annualIncome: number | null;
	moveReason: string;
	commercialUse: string;
	pets: string;
	smoker: string;
	guarantee: string;
	wbs: string;
	liabilityInsurance: string;
	affidavitOfAssets: string;
	insolvency: string;
}

export async function buildSelbstauskunftPdf(data: SelbstauskunftAnswers): Promise<Buffer> {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
	const maxWidth = PAGE_WIDTH - MARGIN * 2;

	let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
	let y = PAGE_HEIGHT - MARGIN;

	function ensureSpace(needed: number) {
		if (y - needed < MARGIN) {
			page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
			y = PAGE_HEIGHT - MARGIN;
		}
	}

	function drawHeading(text: string) {
		ensureSpace(LINE_HEIGHT * 2);
		y -= LINE_HEIGHT * 0.5;
		page.drawText(text, { x: MARGIN, y, size: FONT_SIZE + 2, font: boldFont, color: rgb(0, 0, 0) });
		y -= LINE_HEIGHT * 1.5;
	}

	function drawField(label: string, value: string) {
		const lines = wrapText(value || '—', font, maxWidth - 160);
		ensureSpace(LINE_HEIGHT * lines.length);
		page.drawText(label, { x: MARGIN, y, size: FONT_SIZE, font: boldFont, color: rgb(0, 0, 0) });
		let lineY = y;
		for (const line of lines) {
			page.drawText(line, { x: MARGIN + 160, y: lineY, size: FONT_SIZE, font, color: rgb(0, 0, 0) });
			lineY -= LINE_HEIGHT;
		}
		y -= LINE_HEIGHT * lines.length;
	}

	ensureSpace(LINE_HEIGHT * 2);
	page.drawText('Selbstauskunft', { x: MARGIN, y, size: FONT_SIZE + 6, font: boldFont, color: rgb(0, 0, 0) });
	y -= LINE_HEIGHT * 2.5;

	drawHeading('Persönliche Informationen');
	drawField('Anrede', ANREDE_LABELS[data.anrede] ?? data.anrede);
	drawField('Geburtsdatum', data.birthDate);
	drawField('Vorname', data.firstName);
	drawField('Nachname', data.lastName);
	drawField('Adresse', `${data.street}, ${data.city}`);
	drawField('Telefon', data.phone);
	drawField('E-Mail-Adresse', data.email);
	if (data.aboutMe) drawField('Über mich/uns', data.aboutMe);

	drawHeading('Berufliche Informationen');
	drawField('Beruflicher Status', data.occupationStatus);
	if (data.jobTitle) drawField('Berufsbezeichnung', data.jobTitle);
	if (data.employer) drawField('Arbeitgeber', data.employer);
	if (data.annualIncome) drawField('Einkommen', `${data.annualIncome} €/Jahr`);

	drawHeading('Wohnungsbezogene Informationen');
	drawField('Warum ziehen Sie um?', data.moveReason);
	drawField(
		'Gewerbliche Nutzung',
		YES_NO_LABELS[data.commercialUse] ?? data.commercialUse
	);
	drawField('Haustiere (außer Kleintiere)', YES_NO_LABELS[data.pets] ?? data.pets);
	drawField('Raucher:in', YES_NO_LABELS[data.smoker] ?? data.smoker);

	drawHeading('Weitere Angaben');
	drawField('Bürgschaft vorhanden', YES_NO_LABELS[data.guarantee] ?? data.guarantee);
	drawField('Wohnberechtigungsschein', YES_NO_LABELS[data.wbs] ?? data.wbs);
	drawField(
		'Private Haftpflichtversicherung',
		YES_NO_LABELS[data.liabilityInsurance] ?? data.liabilityInsurance
	);
	drawField(
		'Eidesstattliche Versicherung / Vermögensauskunft (letzte 3 Jahre)',
		YES_NO_LABELS[data.affidavitOfAssets] ?? data.affidavitOfAssets
	);
	drawField(
		'Insolvenzverfahren (letzte 5 Jahre)',
		YES_NO_LABELS[data.insolvency] ?? data.insolvency
	);

	y -= LINE_HEIGHT;
	const declaration =
		'Ich erkläre, dass die vorgenannten Angaben wahrheitsgemäß gemacht wurden. Bei Abschluss eines ' +
		'Mietvertrages können Falschangaben möglicherweise die Aufhebung oder fristlose Kündigung des ' +
		'Mietverhältnisses zur Folge haben.';
	const declarationLines = wrapText(declaration, font, maxWidth);
	ensureSpace(LINE_HEIGHT * (declarationLines.length + 2));
	for (const line of declarationLines) {
		page.drawText(line, { x: MARGIN, y, size: FONT_SIZE - 1, font, color: rgb(0, 0, 0) });
		y -= LINE_HEIGHT;
	}
	y -= LINE_HEIGHT;
	page.drawText(`Datum: ${new Date().toLocaleDateString('de-DE')}`, {
		x: MARGIN,
		y,
		size: FONT_SIZE - 1,
		font,
		color: rgb(0, 0, 0)
	});

	const bytes = await pdf.save();
	return Buffer.from(bytes);
}

export async function buildApplicationPdf(
	coverLetterText: string,
	documents: { storagePath: string; mimeType: string }[],
	coverTemplate: CoverTemplate,
	coverData: CoverPageData
): Promise<Buffer> {
	const pdf = await PDFDocument.create();

	await buildCoverPage(pdf, coverTemplate, coverData);
	await addCoverLetterPages(pdf, coverLetterText);
	for (const doc of documents) {
		await appendDocument(pdf, doc.storagePath, doc.mimeType);
	}

	const bytes = await pdf.save();
	return Buffer.from(bytes);
}
