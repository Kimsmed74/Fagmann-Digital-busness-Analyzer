const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function analyzeBusiness(companyName, websiteData, financialData, performanceData) {
    const prompt = `
    Du er en ekspert på forretningsanalyse og automatisering for små og mellomstore bedrifter (SMB).
    Analyser følgende informasjon om et selskap og generer en detaljert rapport på norsk.

    Selskap: ${companyName || 'Ukjent'}
    Nettside: ${websiteData.url}
    Tittel: ${websiteData.title}
    Beskrivelse: ${websiteData.description || 'N/A'}
    Overskrifter: ${(websiteData.headings && websiteData.headings.length > 0) ? websiteData.headings.join(', ') : 'Ingen funnet'}
    Kontaktinfo (fra nettside): E-post: ${websiteData.emails.join(', ') || 'Ikke funnet'}, Tlf: ${websiteData.phones.join(', ') || 'Ikke funnet'}
    Firma-info (fra register): ${JSON.stringify(financialData)}
    Teknisk helse (PageSpeed): ${JSON.stringify(performanceData)}

    Rapporten skal inneholde:
    0. **Kontaktinformasjon**: List opp relevante e-postadresser, telefonnumre og eventuelle kontaktpersoner funnet.
    1. **Bedriftsoversikt**: En kort oppsummering av hva bedriften gjør basert på nettsiden.
    2. **Analyse av digital tilstedeværelse**: Vurder nettsiden og Google Business-potensialet (basert på informasjonen). Vurder spesifikt den tekniske helsen (PageSpeed) og gi råd om forbedringer.
    3. **Automatiseringsmuligheter**: Identifiser minst 3 manuelle prosesser (tilbud, e-post, regnskap etc.) som kan automatiseres for å spare tid i helgene.
    4. **Scenarioer**: Lag 2 scenarioer som viser hvordan hverdagen til eieren endrer seg ved bruk av AI (f.eks. tid spart, økt presisjon).
    5. **Verktøyforslag (Google AI Studio)**: Foreslå konkrete verktøy som kan bygges i Google AI Studio for å løse deres spesifikke problemer.
    6. **Konklusjon**: En oppsummering av hvor mye de kan tjene/spare på å modernisere seg.

    Svar i strukturert Markdown-format.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini error:', error);
        return "Kunne ikke generere AI-analyse: " + error.message;
    }
}

module.exports = { analyzeBusiness };
