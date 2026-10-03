/**
 * Utilitário compartilhado: antes de imprimir, baixa uma cópia em PDF
 * do documento renderizado (área de impressão), evitando perda de trabalho.
 */
function proximaMoldura() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

function regrasDeImpressaoParaCaptura() {
    const regras = [];
    function coletar(lista) {
        for (const regra of lista) {
            if (regra.type === CSSRule.MEDIA_RULE) {
                if (regra.conditionText.includes('print')) coletar(regra.cssRules);
            } else if (regra.type !== CSSRule.PAGE_RULE && regra.cssText) {
                regras.push(regra.cssText);
            }
        }
    }
    for (const folha of document.styleSheets) {
        try { coletar(folha.cssRules); } catch { /* folhas externas não são necessárias à captura */ }
    }
    return regras.join('\n');
}

function nomeArquivoSeguro(nomePaciente, tipoDocumento) {
    const limpo = String(nomePaciente || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${limpo || 'paciente-sem-nome'}_${tipoDocumento}.pdf`;
}

/**
 * Renderiza a área de impressão em PDF e inicia o download.
 * @param {string} nomeArquivo nome do arquivo .pdf
 * @param {'l'|'p'} orientacao orientação da página A4
 */
async function baixarDocumentoPDF(nomeArquivo, orientacao = 'l') {
    const estilo = document.createElement('style');
    estilo.dataset.exportacaoPdf = 'true';
    estilo.textContent = regrasDeImpressaoParaCaptura();
    document.head.appendChild(estilo);
    document.body.classList.add('print-preview');
    await proximaMoldura();
    await proximaMoldura();
    try {
        const captura = await html2canvas(document.body, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
        });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: orientacao, unit: 'mm', format: 'a4' });
        const larguraPagina = pdf.internal.pageSize.getWidth();
        const alturaPagina = pdf.internal.pageSize.getHeight();
        const escala = Math.min(larguraPagina / captura.width, alturaPagina / captura.height);
        const largura = captura.width * escala;
        const altura = captura.height * escala;
        pdf.addImage(captura.toDataURL('image/jpeg', 0.95), 'JPEG', (larguraPagina - largura) / 2, 0, largura, altura);
        pdf.save(nomeArquivo);
    } finally {
        estilo.remove();
        document.body.classList.remove('print-preview');
    }
}

/**
 * Baixa o PDF e só abre a impressão depois de confirmada pelo usuário.
 * Se a geração do PDF falhar, ainda assim oferece a impressão.
 */
async function baixarPDFEAguardarImpressao(nomeArquivo, orientacao = 'l') {
    try {
        await baixarDocumentoPDF(nomeArquivo, orientacao);
        alert(`PDF baixado: ${nomeArquivo}\nVerifique a pasta Downloads.`);
    } catch (erro) {
        console.error('Falha ao gerar o PDF para backup:', erro);
        alert('Não foi possível gerar o PDF de backup.');
    }
    if (confirm('Deseja abrir a impressão agora?')) {
        window.print();
    }
}
