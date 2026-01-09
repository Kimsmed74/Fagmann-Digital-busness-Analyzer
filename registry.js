const axios = require('axios');

async function searchCompany(query) {
    try {
        if (!query) return null;

        let searchTerm = query.trim();

        // If it's a URL, extract the "brand" name
        if (searchTerm.includes('http') || searchTerm.includes('www.')) {
            try {
                const urlObj = new URL(searchTerm.startsWith('http') ? searchTerm : `https://${searchTerm}`);
                searchTerm = urlObj.hostname.replace('www.', '').split('.')[0];
                // Capitalize first letter for better search
                searchTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);
            } catch (e) {
                // If URL parsing fails, just use the string
            }
        }

        console.log(`Searching registry for: ${searchTerm}`);
        const cleanQuery = searchTerm.replace(/\s/g, '');
        const isOrgnr = /^\d{9}$/.test(cleanQuery);

        let url = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(searchTerm)}`;
        if (isOrgnr) {
            url = `https://data.brreg.no/enhetsregisteret/api/enheter/${cleanQuery}`;
        }

        const response = await axios.get(url, { timeout: 5000 });

        // Handle single result (direct orgnr search) vs list (name search)
        let companyData = null;
        if (isOrgnr) {
            companyData = response.data;
        } else if (response.data._embedded && response.data._embedded.enheter.length > 0) {
            // Find the most relevant (often the one with exactly matching name or first in list)
            companyData = response.data._embedded.enheter[0];
        }

        if (companyData) {
            return {
                companyId: companyData.organisasjonsnummer,
                companyName: companyData.navn,
                industry: companyData.naeringskode1 ? companyData.naeringskode1.beskrivelse : 'Ukjent',
                employees: companyData.antallAnsatte || 'Ikke oppgitt',
                address: companyData.forretningsadresse ?
                    `${companyData.forretningsadresse.adresse ? companyData.forretningsadresse.adresse.join(', ') : ''} ${companyData.forretningsadresse.postnummer || ''} ${companyData.forretningsadresse.poststed || ''}`.trim() :
                    'Ukjent adresse',
                legalForm: companyData.organisasjonsform ? companyData.organisasjonsform.beskrivelse : 'Ukjent',
                registeredDate: companyData.registreringsdatoEnhetsregisteret,
                contactPerson: companyData.navn // Placeholder or CEO if possible
            };
        }
        return null;
    } catch (error) {
        console.error('Registry search error:', error.message);
        return null;
    }
}

module.exports = { searchCompany };
