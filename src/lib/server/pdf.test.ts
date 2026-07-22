import { describe, expect, it } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as fontkitNs from 'fontkit';
import { buildApplicationPdf, wrapText } from './pdf';
import { BITTER_REGULAR_BYTES, BITTER_BOLD_BYTES } from './fonts/bitter';

describe('wrapText', () => {
	it('keeps blank lines as paragraph separators', async () => {
		const pdf = await PDFDocument.create();
		const font = await pdf.embedFont(StandardFonts.Helvetica);

		const lines = wrapText(
			'Hallo Max,\n\nAbsatz eins.\n\nAbsatz zwei.\n\nViele Grüße,\nTorge',
			font,
			451,
			12
		);

		expect(lines.filter((line) => line === '')).toHaveLength(3);
		expect(lines[0]).toBe('Hallo Max,');
		expect(lines.at(-1)).toBe('Torge');
	});

	it('drops characters the standard font cannot encode', async () => {
		const pdf = await PDFDocument.create();
		const font = await pdf.embedFont(StandardFonts.Helvetica);

		expect(wrapText('Hallo 👋 Welt', font, 451, 12)).toEqual(['Hallo  Welt']);
	});
});

describe('buildApplicationPdf', () => {
	const paragraph = (sentences: number) =>
		Array.from(
			{ length: sentences },
			(_, i) => `Satz ${i + 1} über die Wohnung und meine Situation als Bewerber in Lübeck.`
		).join(' ');

	const coverData = {
		fullName: 'Torge Stubbe',
		wgAddress: 'Kronsforder Allee 1',
		street: 'Musterweg 1',
		city: '23552 Lübeck',
		phone: '0123',
		email: 'a@b.de',
		portrait: null,
		portraitOffsetX: 0,
		portraitOffsetY: 0
	};

	it('keeps a full-length letter on a single page', async () => {
		const text = [
			'Hallo Max,',
			'',
			paragraph(9),
			'',
			paragraph(9),
			'',
			paragraph(8),
			'',
			'Viele Grüße,',
			'Torge'
		].join('\n');

		const pdf = await PDFDocument.load(
			await buildApplicationPdf(text, [], 'classic-centered', 'bitter', coverData)
		);

		// Deckblatt + genau eine Briefseite.
		expect(pdf.getPageCount()).toBe(2);
	});

	it('produces a letter page for the bitter font', async () => {
		const pdf = await PDFDocument.load(
			await buildApplicationPdf(
				'Hallo,\n\nIch fotografiere gerne und bin finanziell abgesichert.\n\nViele Grüße,\nTorge',
				[],
				'none',
				'bitter',
				coverData
			)
		);

		expect(pdf.getPageCount()).toBe(1);
	});
});

describe('embedded Bitter font', () => {
	// Mit GSUB ersetzt fontkit "fi"/"fl" durch Ligatur- bzw. Alternativglyphen, die pdf-lib
	// falsch platziert: "fotografiere" wurde als "fotograf iere" gesetzt und das nächste Wort
	// überlappte. Die eingebetteten TTFs sind deshalb ohne GSUB gebaut.
	it('applies no glyph substitutions to f-i words', async () => {
		const fontkit = (fontkitNs as { default?: typeof fontkitNs }).default ?? fontkitNs;

		for (const bytes of [BITTER_REGULAR_BYTES, BITTER_BOLD_BYTES]) {
			const font = fontkit.create(bytes);
			if (!('layout' in font)) throw new Error('Erwartet eine einzelne Schrift, keine Collection.');
			const glyphs = font.layout('fotografiere').glyphs;

			expect(glyphs).toHaveLength('fotografiere'.length);
			// Beide "f" müssen dieselbe Glyphe sein; mit GSUB wird das zweite (vor "i") ersetzt.
			expect(glyphs[7].id).toBe(glyphs[0].id);
		}
	});
});
