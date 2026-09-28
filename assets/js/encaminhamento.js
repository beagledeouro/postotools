function formatarData(dataIso) {
    if (!dataIso) return "";
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
}

function regrasDeImpressaoParaMedicao() {
    const regras = [];
    function coletar(lista) {
        for (const regra of lista) {
            if (regra.type === CSSRule.MEDIA_RULE) {
                if (regra.conditionText.includes('print')) coletar(regra.cssRules);
            } else if (regra.type === CSSRule.PAGE_RULE) {
                continue;
            } else if (regra.cssText) {
                regras.push(regra.cssText);
            }
        }
    }
    for (const folha of document.styleSheets) {
        try { coletar(folha.cssRules); } catch { /* folhas externas não são necessárias à medição */ }
    }
    return regras.join('\n');
}

function proximoQuadro() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

async function gerarPDF() {
    const pares = [1, 2];
    for (const numero of pares) {
        for (const campo of ['nome', 'endereco', 'tipo', 'especialidade', 'descricao', 'profissional']) {
            document.getElementById(`out-p${numero}-${campo}`).textContent = document.getElementById(`p${numero}-${campo}`).value;
        }
        document.getElementById(`out-p${numero}-data`).textContent = formatarData(document.getElementById(`p${numero}-data`).value);
    }

    const medicao = document.createElement('style');
    medicao.dataset.printMeasurement = 'true';
    medicao.textContent = regrasDeImpressaoParaMedicao();
    document.head.appendChild(medicao);
    document.body.classList.add('print-preview');
    await proximoQuadro();
    await proximoQuadro();

    const vias = [...document.querySelectorAll('.referral-half')];
    const excedida = vias.find(via => via.scrollHeight > via.clientHeight + 2 || via.scrollWidth > via.clientWidth + 2);
    medicao.remove();
    document.body.classList.remove('print-preview');

    if (excedida) {
        alert('O conteúdo de uma das vias excede a área imprimível. Reduza ou revise a descrição e os campos longos antes de imprimir; nenhuma via foi cortada.');
        return;
    }
    window.print();
}

document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date();
    const dataLocal = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    document.getElementById('p1-data').value = dataLocal;
    document.getElementById('p2-data').value = dataLocal;
    document.getElementById('btn-print').addEventListener('click', gerarPDF);
});
