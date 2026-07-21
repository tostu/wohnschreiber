import * as cheerio from 'cheerio';

export interface ScrapedListing {
	title: string;
	rent: number | null;
	address: string | null;
	description: string;
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

		const rentText = $('*:contains("Miete")')
			.filter((_, el) => /\d/.test($(el).text()))
			.first()
			.text();
		const rentMatch = rentText.match(/(\d[\d.,]*)\s*€/);
		const rent = rentMatch ? parseInt(rentMatch[1].replace(/[.,]/g, ''), 10) : null;

		const addressMatch = html.match(/(\d{5})\s+([A-Za-zÀ-ÿ\- ]+)/);
		const address = addressMatch ? `${addressMatch[1]} ${addressMatch[2].trim()}` : null;

		return { title, rent, address, description };
	} catch {
		return null;
	}
}
