const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { scrapeWebsite } = require('./scraper');
const { analyzeBusiness } = require('./analyzer');
const { searchCompany } = require('./registry');
const { getPageSpeedData } = require('./pagespeed');
const { generateToolPrompts } = require('./architect');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.post('/api/analyze', async (req, res) => {
    const { url, companyName } = req.body;

    if (!url && !companyName) {
        return res.status(400).json({ error: 'URL or Company Name is required' });
    }

    try {
        console.log(`Starting analysis for: ${companyName || url}`);

        // 1. Registry Search
        const registryData = await searchCompany(companyName || url);

        // 2. Scrape Website and PageSpeed (Parallel)
        let websiteData = { url, title: companyName, description: '', headings: [], emails: [], phones: [], socialLinks: [] };
        let performanceData = { error: 'Ingen URL oppgitt' };

        if (url) {
            try {
                const [scraped, speed] = await Promise.all([
                    scrapeWebsite(url),
                    getPageSpeedData(url)
                ]);
                websiteData = scraped;
                performanceData = speed;
            } catch (pError) {
                console.error('Parallel gathering error:', pError);
                // Fallback to sequential if parallel fails for some reason
                websiteData = await scrapeWebsite(url);
            }
        }

        // 3. AI Analysis
        const analysis = await analyzeBusiness(
            companyName || (registryData ? registryData.companyName : websiteData.title),
            websiteData,
            registryData,
            performanceData
        );

        res.json({
            success: true,
            companyName: companyName || (registryData ? registryData.companyName : websiteData.title),
            registryData,
            websiteData,
            performanceData,
            analysis: analysis
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Internal server error during analysis: ' + error.message });
    }
});

app.post('/api/architect', async (req, res) => {
    const { reportText } = req.body;

    if (!reportText) {
        return res.status(400).json({ error: 'Report text is required' });
    }

    try {
        console.log('Generating tool prompts for report...');
        const toolPrompts = await generateToolPrompts(reportText);
        res.json({ success: true, toolPrompts });
    } catch (error) {
        console.error('Architect error:', error);
        res.status(500).json({ error: 'Internal server error during tool generation' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
