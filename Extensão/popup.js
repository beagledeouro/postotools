const statusDiv = document.getElementById('status');
const botoesAcao = [...document.querySelectorAll('[data-action]')];

function dataLocalISO() {
    const agora = new Date();
    return new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

document.getElementById('dataComparecimento').value = dataLocalISO();

async function obterDadosPaciente() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || /^(chrome|edge|about):/i.test(tab.url)) {
        throw new Error('Abra a ficha do paciente no G-MUS antes de gerar o documento.');
    }

    const resultados = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: extrairDadosGMUS,
    });
    const dados = resultados.find(frame => frame.result?.nome?.trim())?.result;
    if (!dados) throw new Error('Não encontrei os dados. Abra a ficha do paciente no G-MUS.');
    return dados;
}

async function executarAcao(acao) {
    botoesAcao.forEach(botao => { botao.disabled = true; });
    statusDiv.textContent = 'Extraindo dados da ficha do G-MUS...';

    try {
        const dados = await obterDadosPaciente();
        statusDiv.textContent = 'Dados encontrados. Gerando PDF...';

        if (acao === 'capa') await gerarCapaPDF(dados, 'Capa.pdf', 'Capa');
        if (acao === 'gestante') await gerarCapaGestantePDF(dados);
        if (acao === 'declaracao') await gerarDeclaracaoPDF(dados);
        statusDiv.textContent = 'PDF gerado e enviado para downloads.';
    } catch (erro) {
        statusDiv.textContent = erro.message || 'Não foi possível gerar o PDF.';
        console.error('Erro ao gerar documento:', erro);
    } finally {
        botoesAcao.forEach(botao => { botao.disabled = false; });
    }
}

botoesAcao.forEach(botao => {
    botao.addEventListener('click', () => executarAcao(botao.dataset.action));
});

// 1. EXTRAÇÃO DE DADOS 
function extrairDadosGMUS() {
    const extrairTexto = (seletor) => {
        const el = document.querySelector(seletor);
        if (!el) return '';
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value.trim();
        if (el.tagName === 'SELECT') return el.options[el.selectedIndex]?.text.trim() || el.value.trim();
        return el.innerText.trim();
    };

    const isMarcado = (seletor) => {
        const el = document.querySelector(seletor);
        return el ? el.checked : false;
    };

    const temMarcador = (palavra) => document.body.innerText.toUpperCase().includes(palavra.toUpperCase());

    const ddd = extrairTexto('#end_ddd_celular');
    const celular = extrairTexto('#end_nr_fone_celular');
    const telefoneFormatado = ddd ? `(${ddd}) ${celular}` : celular;

    return {
        nome: extrairTexto('#no_usuario'),
        codigo: extrairTexto('#id_usuario_gms'),
        cpf: extrairTexto('#cpf'),
        cns: extrairTexto('#nr_cns'),
        dataNasc: extrairTexto('#dt_nascimento'),
        sexo: extrairTexto('#id_sexo'), 
        estadoCivil: extrairTexto('#id_estado_civil') || extrairTexto('#estado_civil'), 
        mae: extrairTexto('#text_id_mae'),
        pai: extrairTexto('#text_id_pai'),
        natural: extrairTexto('#text_id_munlocnaturaliade'),
        telefone: telefoneFormatado,
        endereco: extrairTexto('#text_end_id_logradouro'),
        numero: extrairTexto('#end_nr_logradouro'),
        complemento: extrairTexto('#end_no_compl_logradouro'),
        bairro: extrairTexto('#text_end_id_bairro'),
        profissao: extrairTexto('#text_id_cbo'),
        area: extrairTexto("#text_dgu_micarea_id"), 
        cep: extrairTexto("#end_id_cep"),
        alergias: "", 

        tabagismo: isMarcado('#status_eh_fumante-1'),
        etilismo: isMarcado('#status_eh_dependente_alcool-1'),
        hipertenso: isMarcado('#status_tem_hipertensao_arterial-1'),
        avc: isMarcado('#status_teve_avc_derrame-1'),
        renal: isMarcado('#status_tem_teve_doencas_rins-1'),
        pele: isMarcado('#status_tem_hanseniase-1'), 
        tuberculose: isMarcado('#status_tem_tuberculose-1'),
        cancer: isMarcado('#status_tem_teve_cancer-1'),
        obeso: isMarcado('#situacao_peso-2'),
        mental: isMarcado('#status_tratamento_psiquico_ou_probema_mental-1'),
        droga: isMarcado('#status_eh_dependente_outras_drogas-1'), 
        outros: extrairTexto('#descricao_outra_condicao1').length > 0, 
        diabetico: isMarcado("#status_tem_diabetes-1"),
    };
}

function nomeArquivoSeguro(nome) {
    return (nome || 'Paciente').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Paciente';
}

async function baixarPDF(pdfBytes, nomeArquivo) {
    const blobUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }));
    await new Promise((resolve, reject) => {
        chrome.downloads.download({ url: blobUrl, filename: nomeArquivo, saveAs: true }, downloadId => {
            const erro = chrome.runtime.lastError;
            if (erro) {
                URL.revokeObjectURL(blobUrl);
                reject(new Error(erro.message));
                return;
            }
            if (downloadId === undefined) {
                URL.revokeObjectURL(blobUrl);
                reject(new Error('O Chrome não iniciou o download.'));
                return;
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            resolve(downloadId);
        });
    });
}

function preencherTexto(form, campo, valor) {
    if (!valor) return;
    try {
        form.getTextField(campo).setText(String(valor));
    } catch (erro) {
        console.warn(`Campo PDF indisponível: ${campo}`, erro);
    }
}

function separarData(valor) {
    if (!valor) return null;
    const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const brasileira = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (iso) return { ano: iso[1], mes: iso[2], dia: iso[3] };
    if (brasileira) return { dia: brasileira[1], mes: brasileira[2], ano: brasileira[3] };
    return null;
}

async function carregarFormularioPDF(arquivo) {
    const resposta = await fetch(chrome.runtime.getURL(arquivo));
    if (!resposta.ok) throw new Error(`Não foi possível abrir o modelo ${arquivo}.`);
    return PDFLib.PDFDocument.load(await resposta.arrayBuffer());
}

async function gerarCapaPDF(dados, arquivoModelo, prefixo) {
    const pdfDoc = await carregarFormularioPDF(arquivoModelo);
    const form = pdfDoc.getForm();
    const marcar = (campo, condicao) => {
        if (!condicao) return;
        try { form.getCheckBox(campo).check(); }
        catch (erro) { console.warn(`Checkbox PDF indisponível: ${campo}`, erro); }
    };

    if (arquivoModelo === 'Capa.pdf') {
        preencherTexto(form, 'nome_3j3y', dados.nome);
        preencherTexto(form, 'cod_7n6g', dados.codigo);
        preencherTexto(form, 'endereco_9t9s', dados.endereco);
        preencherTexto(form, 'text_136_415_2k0w', dados.numero);
        preencherTexto(form, 'complemento_0x0t', dados.complemento);
        preencherTexto(form, 'bairro_2c9x', dados.bairro);
        preencherTexto(form, 'profissao_4n5a', dados.profissao);
        preencherTexto(form, 'contato_3x9v', dados.telefone);
        preencherTexto(form, 'mae_8m8o', dados.mae);
        preencherTexto(form, 'pai_2g4t', dados.pai);
        preencherTexto(form, 'cartao_sus_0e9s', dados.cns);
        preencherTexto(form, 'cpf_8b7k', dados.cpf);
        preencherTexto(form, 'naturalidade_1o6y', dados.natural);
        preencherTexto(form, 'micro_area_6l0p', dados.area);
        preencherTexto(form, 'cep_3j0e', dados.cep);
        preencherTexto(form, 'est_civil_8u5g', dados.estadoCivil);
        preencherTexto(form, 'alergico_5f5l', dados.alergias);

        const nascimento = separarData(dados.dataNasc);
        if (nascimento) {
            preencherTexto(form, 'data_nasc_day_4i9b', nascimento.dia);
            preencherTexto(form, 'data_nasc_month_2b0w', nascimento.mes);
            preencherTexto(form, 'data_nasc_year_9p3w', nascimento.ano);
        }

        if (dados.sexo) {
            const sexo = dados.sexo.toUpperCase();
            try {
                const radio = form.getRadioGroup('sexo_0z4m');
                if (sexo.startsWith('F')) radio.select('fem_1h6i');
                else if (sexo.startsWith('M')) radio.select('masc_9g3z');
            } catch (erro) {
                if (sexo.startsWith('F')) marcar('fem_1h6i', true);
                else if (sexo.startsWith('M')) marcar('masc_9g3z', true);
            }
        }

        [
            ['acamados_domiciliado_9e6j', dados.acamado], ['doenca_renal_3w2s', dados.renal],
            ['doenca_renal_2v0x', dados.renal], ['deficiencia_7z0e', dados.deficiencia],
            ['deficiencia_2n6d', dados.deficiencia], ['hipertensao_4s5s', dados.hipertenso],
            ['saude_mental_4e2c', dados.mental], ['usuarios_de_drogas_6j5c', dados.droga],
            ['diabetes_4p5i', dados.diabetico], ['hanseniase_2v3r', dados.pele],
            ['obesidade_0j2n', dados.obeso], ['avc_7a3i', dados.avc],
            ['tuberculose_2v6z', dados.tuberculose], ['depressao_1i0s', dados.depressao],
            ['infarto_9d4p', dados.infarto], ['cancer_5n5n', dados.cancer],
            ['outros_5u2g', dados.outros], ['tabagismo_7p3v', dados.tabagismo],
            ['etilismo_4y7u', dados.etilismo], ['anti_hipertensivos_3z5m', dados.rPressao],
            ['anticoncepcionais_6n5g', dados.anticoncepcional],
            ['hipoglicemia_ante_oral_2x3e', dados.rGlicose],
            ['psicotropico_9l3m', dados.rMental], ['insulina_6k7l', dados.insulina],
        ].forEach(([campo, valor]) => marcar(campo, valor));
    } else {
        const nascimento = separarData(dados.dataNasc);
        const campos = {
            nome_9h1r: dados.nome,
            data_de_nascimento_3l8h: nascimento ? `${nascimento.dia}/${nascimento.mes}/${nascimento.ano}` : '',
            sexo_7s0c: dados.sexo,
            est_civil_1o9s: dados.estadoCivil,
            natural_8k6v: dados.natural,
            filiacao_mae_5i5f: dados.mae,
            pai_5e5i: dados.pai,
            cpf_5h3q: dados.cpf,
            cartao_sus_1a6o: dados.cns,
            endereco_3s0j: dados.endereco,
            text_1009_636_6o6t: dados.numero,
            bairro_7m5k: dados.bairro,
            cep_2o4c: dados.cep,
        };
        Object.entries(campos).forEach(([campo, valor]) => preencherTexto(form, campo, valor));
    }

    form.updateFieldAppearances();
    await baixarPDF(await pdfDoc.save(), `${prefixo}_${nomeArquivoSeguro(dados.nome)}.pdf`);
}

async function gerarCapaGestantePDF(dados) {
    await gerarCapaPDF(dados, 'Capa_Gestante.pdf', 'Capa_Gestante');
}

function desenharTextoQuebrado(pagina, texto, x, y, largura, fonte, tamanho, alturaLinha, cor) {
    const palavras = String(texto || '').split(/\s+/).filter(Boolean);
    let linha = '';
    for (const palavra of palavras) {
        const teste = linha ? `${linha} ${palavra}` : palavra;
        if (linha && fonte.widthOfTextAtSize(teste, tamanho) > largura) {
            pagina.drawText(linha, { x, y, size: tamanho, font: fonte, color: cor });
            y -= alturaLinha;
            linha = palavra;
        } else {
            linha = teste;
        }
    }
    if (linha) {
        pagina.drawText(linha, { x, y, size: tamanho, font: fonte, color: cor });
        y -= alturaLinha;
    }
    return y;
}

async function gerarDeclaracaoPDF(dados) {
    const data = document.getElementById('dataComparecimento').value;
    if (!data) throw new Error('Informe a data do comparecimento.');

    const pdfDoc = await PDFLib.PDFDocument.create();
    const pagina = pdfDoc.addPage();
    const fonte = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const negrito = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const tinta = PDFLib.rgb(0.12, 0.20, 0.24);
    const secundaria = PDFLib.rgb(0.36, 0.42, 0.45);
    const margem = 58;
    const largura = pagina.getWidth() - margem * 2;
    let y = 770;

    const titulo = 'ESF CDI 2';
    pagina.drawText(titulo, { x: (pagina.getWidth() - negrito.widthOfTextAtSize(titulo, 16)) / 2, y, size: 16, font: negrito, color: tinta });
    y -= 48;
    const subtitulo = 'DECLARAÇÃO DE COMPARECIMENTO';
    pagina.drawText(subtitulo, { x: (pagina.getWidth() - negrito.widthOfTextAtSize(subtitulo, 14)) / 2, y, size: 14, font: negrito, color: tinta });
    y -= 38;
    pagina.drawLine({ start: { x: margem, y }, end: { x: pagina.getWidth() - margem, y }, thickness: 1, color: secundaria });
    y -= 36;

    y = desenharTextoQuebrado(pagina, 'IDENTIFICAÇÃO DO(A) PACIENTE', margem, y, largura, negrito, 10, 16, secundaria);
    const identificacao = [
        ['Nome', dados.nome], ['CPF', dados.cpf], ['Cartão SUS', dados.cns],
        ['Data de nascimento', (() => { const nascimento = separarData(dados.dataNasc); return nascimento ? `${nascimento.dia}/${nascimento.mes}/${nascimento.ano}` : ''; })()],
    ].filter(([, valor]) => valor);
    for (const [rotulo, valor] of identificacao) {
        y = desenharTextoQuebrado(pagina, `${rotulo}: ${valor}`, margem, y, largura, fonte, 11, 18, tinta);
    }

    y -= 28;
    const dataFormatada = (() => { const partes = separarData(data); return `${partes.dia}/${partes.mes}/${partes.ano}`; })();
    const inicio = document.getElementById('horaInicio').value || '________';
    const fim = document.getElementById('horaFim').value || '________';
    const declaracao = `Declaramos, para os devidos fins, que a pessoa identificada acima compareceu à unidade ESF CDI 2 em ${dataFormatada}, para atendimento em saúde.`;
    y = desenharTextoQuebrado(pagina, declaracao, margem, y, largura, fonte, 12, 21, tinta) - 12;
    y = desenharTextoQuebrado(pagina, `Horário: das ${inicio} às ${fim}.`, margem, y, largura, fonte, 12, 21, tinta);

    y -= 45;
    y = desenharTextoQuebrado(pagina, `Sete Lagoas - MG, ${dataFormatada}.`, margem, y, largura, fonte, 11, 18, tinta);
    const linhaY = Math.max(y - 100, 110);
    pagina.drawLine({ start: { x: 155, y: linhaY }, end: { x: pagina.getWidth() - 155, y: linhaY }, thickness: 1, color: tinta });
    const assinatura = 'Assinatura e carimbo do(a) profissional responsável';
    pagina.drawText(assinatura, { x: (pagina.getWidth() - fonte.widthOfTextAtSize(assinatura, 9)) / 2, y: linhaY - 18, size: 9, font: fonte, color: secundaria });
    pagina.drawText('Documento para conferência e assinatura do profissional responsável.', {
        x: margem, y: 55, size: 8, font: fonte, color: secundaria,
    });

    await baixarPDF(await pdfDoc.save(), `Declaracao_Comparecimento_${nomeArquivoSeguro(dados.nome)}.pdf`);
}