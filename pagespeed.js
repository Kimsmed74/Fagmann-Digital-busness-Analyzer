const axios = require('axios');

async function getPageSpeedData(url) {
    try {
        console.log(`Fetching PageSpeed for: ${url}`);
        const apiKey = process.env.GOOGLE_API_KEY;
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=PERFORMANCE&category=ACCESSIBILITY&category=SEO&category=BEST_PRACTICES`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const data = response.data.lighthouseResult;

        return {
            performanceScore: data.categories.performance.score * 100,
            accessibilityScore: data.categories.accessibility.score * 100,
            seoScore: data.categories.seo.score * 100,
            bestPracticesScore: data.categories['best-practices'].score * 100,
            metrics: {
                lcp: data.audits['largest-contentful-paint'].displayValue,
                fcp: data.audits['first-contentful-paint'].displayValue,
                cls: data.audits['cumulative-layout-shift'].displayValue,
                speedIndex: data.audits['speed-index'].displayValue
            }
        };
    } catch (error) {
        console.error('PageSpeed error:', error.message);
        return { error: 'Kunne ikke hente tekniske stats' };
    }
}

module.exports = { getPageSpeedData };
