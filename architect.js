document.addEventListener('DOMContentLoaded', () => {
    const generatePromptsBtn = document.getElementById('generatePromptsBtn');
    const reportInput = document.getElementById('reportInput');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const promptsOutput = document.getElementById('promptsOutput');
    const copyAllBtn = document.getElementById('copyAllBtn');

    generatePromptsBtn.addEventListener('click', async () => {
        const reportText = reportInput.value.trim();

        if (!reportText) {
            alert('Vennligst lim inn en rapport først.');
            return;
        }

        // Show Loading
        loadingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        generatePromptsBtn.disabled = true;

        try {
            const response = await fetch('/api/architect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportText })
            });

            const data = await response.json();

            if (data.success) {
                promptsOutput.innerHTML = marked.parse(data.toolPrompts);
                loadingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
                // Scroll to results
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Feil ved generering: ' + (data.error || 'Ukjent feil'));
                loadingSection.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('En feil oppstod under genereringen.');
            loadingSection.classList.add('hidden');
        } finally {
            generatePromptsBtn.disabled = false;
        }
    });

    copyAllBtn.addEventListener('click', () => {
        const text = promptsOutput.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('Alle prompts er kopiert til utklippstavlen!');
        });
    });
});
