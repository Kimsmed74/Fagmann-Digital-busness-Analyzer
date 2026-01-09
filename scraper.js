const puppeteer = require('puppeteer');

async function scrapeWebsite(url) {
    let browser;
    try {
        console.log(`Scraping with Puppeteer: ${url}`);

        // Render specific configuration
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Often needed in containers
                '--disable-gpu'
            ]
        };

        // If on Render, explicitly try to use the cache directory we set
        if (process.env.PUPPETEER_CACHE_DIR) {
            console.log('Using custom Puppeteer cache dir:', process.env.PUPPETEER_CACHE_DIR);
            // Puppeteer should pick this up automatically via the ENV var, 
            // but we add log to confirm it's seen.
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set timeout and wait until network is idle
        console.log('Navigating to URL...');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        console.log('Navigation complete. Evaluating...');

        const data = await page.evaluate(() => {
            const title = document.title || '';
            const description = document.querySelector('meta[name="description"]')?.content ||
                document.querySelector('meta[property="og:description"]')?.content || '';

            // Extract text content (cleaned)
            const bodyText = document.body.innerText;

            // Extract headings
            const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
                .map(h => h.innerText.trim())
                .filter(h => h.length > 0) // Fixed filter syntax
                .slice(0, 15);

            // Common social links
            const socialLinks = Array.from(document.querySelectorAll('a[href*="facebook.com"], a[href*="linkedin.com"], a[href*="instagram.com"], a[href*="google.com/maps"]'))
                .map(a => a.href);

            return {
                title: title.trim(),
                description: description.trim(),
                headings,
                socialLinks: [...new Set(socialLinks)],
                bodyText: bodyText.substring(0, 5000) // Limit text for AI
            };
        });
        console.log('Evaluation complete.');

        // Regex for emails and phones (run on server side for better control)
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /(?:\+47|0047)?\s?[2-9]\d{1}\s?\d{2}\s?\d{2}\s?\d{2}/g;

        const emails = data.bodyText.match(emailRegex) || [];
        const phones = data.bodyText.match(phoneRegex) || [];

        console.log('Scraping finished. Closing browser...');
        return {
            url,
            ...data,
            emails: [...new Set(emails)],
            phones: [...new Set(phones)],
            scrapedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Puppeteer error scraping ${url}:`, error.message);
        return {
            url,
            title: 'Kunne ikke hente tittel',
            description: 'Siden kunne ikke leses av Puppeteer.',
            headings: [],
            emails: [],
            phones: [],
            socialLinks: [],
            error: error.message
        };
    } finally {
        if (browser) {
            console.log('Closing browser instance...');
            await browser.close();
            console.log('Browser closed.');
        }
    }
}

module.exports = { scrapeWebsite };
