import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFile } from './storage';

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

function wrapText(text: string, font: import('pdf-lib').PDFFont, maxWidth: number): string[] {
	const lines: string[] = [];
	for (const paragraph of text.split('\n')) {
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

export async function buildApplicationPdf(
	coverLetterText: string,
	documents: { storagePath: string; mimeType: string }[]
): Promise<Buffer> {
	const pdf = await PDFDocument.create();

	await addCoverLetterPages(pdf, coverLetterText);
	for (const doc of documents) {
		await appendDocument(pdf, doc.storagePath, doc.mimeType);
	}

	const bytes = await pdf.save();
	return Buffer.from(bytes);
}
