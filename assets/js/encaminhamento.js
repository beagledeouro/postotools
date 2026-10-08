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
        try { coletar(folha.cssRules); } catch { /* folhas externas */ }
    }
    return regras.join('\n');
}

function proximoQuadro() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function duplicarPaciente1() {
    const campos = ['nome', 'cns', 'endereco', 'tipo', 'especialidade', 'cid', 'descricao', 'profissional', 'data'];
    campos.forEach(campo => {
        const p1Val = document.getElementById(`p1-${campo}`).value;
        const p2El = document.getElementById(`p2-${campo}`);
        if (p2El) p2El.value = p1Val;
    });
}

function limparPaciente2() {
    const campos = ['nome', 'cns', 'endereco', 'especialidade', 'cid', 'descricao'];
    campos.forEach(campo => {
        const el = document.getElementById(`p2-${campo}`);
        if (el) el.value = '';
    });
}

function carregarParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('nome')) document.getElementById('p1-nome').value = params.get('nome');
    if (params.has('cns')) document.getElementById('p1-cns').value = params.get('cns');
    if (params.has('endereco')) document.getElementById('p1-endereco').value = params.get('endereco');
    if (params.has('especialidade')) document.getElementById('p1-especialidade').value = params.get('especialidade');
    if (params.has('tipo')) document.getElementById('p1-tipo').value = params.get('tipo');
    if (params.has('cid')) document.getElementById('p1-cid').value = params.get('cid');
    if (params.has('profissional')) document.getElementById('p1-profissional').value = params.get('profissional');
}

async function gerarPDF() {
    // Se paciente 2 estiver completamente em branco e paciente 1 preenchido,
    // pergunta ou duplica automaticamente para gerar 2 vias do mesmo paciente
    const p1Nome = document.getElementById('p1-nome').value.trim();
    const p2Nome = document.getElementById('p2-nome').value.trim();

    if (!p1Nome && !p2Nome) {
        alert('Por favor, preencha ao menos o nome do Paciente 1.');
        document.getElementById('p1-nome').focus();
        return;
    }

    if (p1Nome && !p2Nome) {
        if (confirm('O Paciente 2 está vazio. Deseja duplicar os dados do Paciente 1 para imprimir em 2 vias (via do paciente + via do prontuário)?')) {
            duplicarPaciente1();
        }
    }

    const pares = [1, 2];
    for (const numero of pares) {
        for (const campo of ['nome', 'cns', 'endereco', 'tipo', 'especialidade', 'cid', 'descricao', 'profissional']) {
            const outEl = document.getElementById(`out-p${numero}-${campo}`);
            const inEl = document.getElementById(`p${numero}-${campo}`);
            if (outEl && inEl) {
                outEl.textContent = inEl.value;
            }
        }
        const dataVal = document.getElementById(`p${numero}-data`).value;
        const outDataEl = document.getElementById(`out-p${numero}-data`);
        if (outDataEl) outDataEl.textContent = formatarData(dataVal);

        // Ocultar linha de CID se estiver vazia
        const cidField = document.getElementById(`field-p${numero}-cid`);
        const cidVal = document.getElementById(`p${numero}-cid`).value.trim();
        if (cidField) cidField.style.display = cidVal ? 'block' : 'none';

        // Ocultar linha de CNS se estiver vazia
        const cnsField = document.getElementById(`field-p${numero}-cns`);
        const cnsVal = document.getElementById(`p${numero}-cns`).value.trim();
        if (cnsField) cnsField.style.display = cnsVal ? 'block' : 'none';
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
        alert('O conteúdo de uma das vias excede a área imprimível da folha. Reduza ou resuma a descrição clínica para evitar cortes na impressão.');
        return;
    }

    const nomeParaArquivo = document.getElementById('p1-nome').value || document.getElementById('p2-nome').value;
    await baixarPDFEAguardarImpressao(nomeArquivoSeguro(nomeParaArquivo, 'encaminhamento'), 'l');
}

document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date();
    const dataLocal = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    document.getElementById('p1-data').value = dataLocal;
    document.getElementById('p2-data').value = dataLocal;

    carregarParametrosURL();

    document.getElementById('btn-duplicar-p1').addEventListener('click', duplicarPaciente1);
    document.getElementById('btn-limpar-p2').addEventListener('click', limparPaciente2);
    document.getElementById('btn-print').addEventListener('click', gerarPDF);
});
