import * as cheerio from 'cheerio';

export interface ScrapedListing {
	title: string;
	rent: number | null;
	address: string | null;
	description: string;
	contactName: string | null;
}

/** Parses a German-formatted euro amount ("1.200,50 €") into a rounded integer. */
function parseGermanEuro(text: string): number | null {
	const match = text.match(/(\d[\d.,]*)\s*€/);
	if (!match) return null;
	return Math.round(parseFloat(match[1].replace(/\./g, '').replace(',', '.')));
}

/**
 * Best-effort scrape of a WG-Gesucht listing page. wg-gesucht's markup and bot
 * protection can change at any time, so failures are expected — callers must
 * fall back to a manual description field when this returns null.
 */
export async function fetchListingInfo(url: string): Promise<ScrapedListing | null> {
	try {
		const res = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Wohnschreiber/1.0)'
			}
		});
		if (!res.ok) return null;

		const html = await res.text();
		const $ = cheerio.load(html);

		const title = $('h1').first().text().trim() || $('title').text().trim();
		if (!title) return null;

		const bodyText = $('#ad_description_text, .freitext_content, .col-sm-12 .text-justify')
			.first()
			.text()
			.trim();
		const description = bodyText || $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);

		// "Kosten" panel has a dedicated "Miete:" row; match on it directly instead of the
		// first element that merely contains the word "Miete" somewhere in its text, which
		// can match a page-wide ancestor and pick up an unrelated € amount (e.g. a promo price).
		const rentLabel = $('.section_panel_detail')
			.filter((_, el) => $(el).text().trim() === 'Miete:')
			.first();
		let rent = rentLabel.length
			? parseGermanEuro(rentLabel.parent().next().find('.section_panel_value').first().text())
			: null;

		if (rent === null) {
			const gesamtmieteLabel = $('.key_fact_detail')
				.filter((_, el) => $(el).text().trim() === 'Gesamtmiete')
				.first();
			rent = gesamtmieteLabel.length
				? parseGermanEuro(gesamtmieteLabel.closest('div').find('.key_fact_value').first().text())
				: null;
		}

		if (rent === null) {
			const rentText = $('*:contains("Miete")')
				.filter((_, el) => /\d/.test($(el).text()))
				.first()
				.text();
			rent = parseGermanEuro(rentText);
		}

		// Scope to the dedicated "Adresse" panel instead of regex-scanning the whole HTML
		// document, which can match unrelated 5-digit+word text elsewhere on the page (e.g.
		// wg-gesucht's own company address embedded in a page-wide JSON-LD Organization block).
		const addressLabel = $('h2.section_panel_title')
			.filter((_, el) => $(el).text().trim() === 'Adresse')
			.first();
		const addressDetail = addressLabel.length
			? addressLabel.parent().find('.section_panel_detail').first()
			: null;
		let address: string | null = null;
		if (addressDetail && addressDetail.length) {
			const lines: string[] = [];
			let current = '';
			addressDetail
				.contents()
				.each((_, node) => {
					if (node.type === 'tag' && node.name === 'br') {
						if (current.trim()) lines.push(current.trim());
						current = '';
					} else {
						current += $(node).text();
					}
				});
			if (current.trim()) lines.push(current.trim());
			address = lines.length ? lines.join(', ') : null;
		}

		// wg-gesucht masks the poster's real name behind an image (alt="public name" /
		// "Profilbild" / etc.) for logged-out requests; only initials in the avatar are
		// plain text. Grab whichever is available as a best-effort default — the user
		// can correct it in the UI.
		const genericAltLabels = new Set(['public name', 'profilbild', 'avatar', 'profile picture']);
		const profileImgAlt = $('.user_profile_info img').first().attr('alt')?.trim();
		const initials = $('.profile_image_initials').first().text().replace(/\s+/g, ' ').trim();
		const contactName =
			profileImgAlt && !genericAltLabels.has(profileImgAlt.toLowerCase())
				? profileImgAlt
				: initials || null;

		return { title, rent, address, description, contactName };
	} catch {
		return null;
	}
}
