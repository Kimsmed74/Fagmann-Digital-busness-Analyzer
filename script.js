document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const companyUrl = document.getElementById('companyUrl');
    const companyNameInput = document.getElementById('companyName');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const aiReport = document.getElementById('aiReport');
    const companySummary = document.getElementById('companySummary');
    const financialSummary = document.getElementById('financialSummary');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const copyReportBtn = document.getElementById('copyReportBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    let currentCompanyName = '';

    analyzeBtn.addEventListener('click', async () => {
        const url = companyUrl.value.trim();
        const name = companyNameInput.value.trim();

        if (!url && !name) {
            alert('Vennligst skriv inn en URL eller et bedriftsnavn');
            return;
        }

        // Reset and Show Loading
        loadingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        analyzeBtn.disabled = true;

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, companyName: name })
            });

            const data = await response.json();

            if (data.success) {
                currentCompanyName = data.companyName;

                // Render Results
                companySummary.innerHTML = `
                    <p><strong>${data.companyName}</strong></p>
                    <p>${data.websiteData.title || ''}</p>
                    <div style="margin-top: 1rem; font-size: 0.9rem; border-top: 1px solid var(--border); padding-top: 0.5rem;">
                        <p>📧 ${data.websiteData.emails.length > 0 ? data.websiteData.emails[0] : 'Ingen e-post funnet'}</p>
                        <p>📞 ${data.websiteData.phones.length > 0 ? data.websiteData.phones[0] : 'Ingen tlf funnet'}</p>
                    </div>
                    <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem;">${data.websiteData.description || 'Ingen beskrivelse funnet.'}</p>
                `;

                financialSummary.innerHTML = `
                    <p>Org.nr: <span style="color: #6366f1;">${data.registryData ? data.registryData.companyId : 'N/A'}</span></p>
                    <p>Bransje: ${data.registryData ? data.registryData.industry : 'Ukjent'}</p>
                    <p>Ansatte: ${data.registryData ? data.registryData.employees : 'N/A'}</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem; color: #94a3b8;">Adresse: ${data.registryData ? data.registryData.address : 'N/A'}</p>
                `;

                aiReport.innerHTML = marked.parse(data.analysis);

                loadingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
            } else {
                alert('Analyse feilet: ' + (data.error || 'Ukjent feil'));
                loadingSection.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('En feil oppstod under analysen.');
            loadingSection.classList.add('hidden');
        } finally {
            analyzeBtn.disabled = false;
        }
    });

    newAnalysisBtn.addEventListener('click', () => {
        resultsSection.classList.add('hidden');
        companyUrl.value = '';
        companyNameInput.value = '';
        currentCompanyName = '';
        document.title = 'Business Analyzer | AI-drevet Innsikt';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    copyReportBtn.addEventListener('click', () => {
        const text = aiReport.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('Rapport kopiert til utklippstavlen!');
        });
    });

    downloadPdfBtn.addEventListener('click', () => {
        const originalTitle = document.title;
        if (currentCompanyName) {
            document.title = `Analyse - ${currentCompanyName}`;
        }
        window.print();
        // Option: reset title after a short delay so user doesn't see it permanently changed
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    });
});
