function formatarData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function definirDataHoje(campo) {
    const hoje = new Date();
    const dataLocal = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    campo.value = dataLocal;
}

function aplicarMascaraCPF(valor) {
    let limpo = valor.replace(/\D/g, '').slice(0, 11);
    if (limpo.length > 9) {
        return limpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
    } else if (limpo.length > 6) {
        return limpo.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
    } else if (limpo.length > 3) {
        return limpo.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
    }
    return limpo;
}

function atualizarPrevisaoRetorno() {
    const inicioStr = document.getElementById('inicioAfastamento').value;
    const dias = parseInt(document.getElementById('qtdDias').value, 10) || 1;
    if (!inicioStr) return;

    const [ano, mes, dia] = inicioStr.split('-').map(Number);
    const dataInicio = new Date(ano, mes - 1, dia);
    // Adiciona os dias de afastamento
    dataInicio.setDate(dataInicio.getDate() + dias);

    const d = String(dataInicio.getDate()).padStart(2, '0');
    const m = String(dataInicio.getMonth() + 1).padStart(2, '0');
    const a = dataInicio.getFullYear();

    document.getElementById('previsaoRetorno').value = `${d}/${m}/${a}`;
}

function mudarTipoDoc() {
    const tipo = document.getElementById('tipoDoc').value;
    const secaoAtestado = document.getElementById('secaoAtestado');
    const secaoDeclaracao = document.getElementById('secaoDeclaracao');
    const secaoAcompanhante = document.getElementById('secaoAcompanhante');

    secaoAtestado.style.display = tipo === 'atestado' ? 'block' : 'none';
    secaoDeclaracao.style.display = tipo === 'declaracao' ? 'block' : 'none';
    secaoAcompanhante.style.display = tipo === 'acompanhante' ? 'block' : 'none';

    if (tipo === 'atestado') {
        atualizarPrevisaoRetorno();
    }
}

function toggleCid() {
    document.getElementById('divCidCampos').style.display = document.getElementById('exibirCid').checked ? 'block' : 'none';
}

function criarElemento(tag, texto, classe) {
    const node = document.createElement(tag);
    if (texto !== undefined && texto !== null) node.textContent = texto;
    if (classe) node.className = classe;
    return node;
}

function criarTextoComDestaque(partes) {
    const paragrafo = document.createElement('p');
    partes.forEach(parte => {
        if (typeof parte === 'string') paragrafo.appendChild(document.createTextNode(parte));
        else paragrafo.appendChild(criarElemento('strong', parte.destaque));
    });
    return paragrafo;
}

function gerarVia(conteudo, unidade, medicoInfo, temCarimbo, dataDoc) {
    const via = criarElemento('div', null, 'via-doc');
    const cabecalho = criarElemento('div', null, 'via-header');
    const marca = criarElemento('div', null, 'print-branding');
    const logo = document.createElement('img');
    logo.src = '../assets/logo.png';
    logo.alt = 'Sete Lagoas Prefeitura e Secretaria Municipal da Saúde';

    const unidadeMarca = criarElemento('div', null, 'print-branding-unit');
    unidadeMarca.append(criarElemento('strong', unidade), criarElemento('span', 'Secretaria Municipal de Saúde'));
    marca.append(logo, unidadeMarca);

    cabecalho.append(marca, criarElemento('h3', conteudo.titulo));

    const corpo = criarElemento('div', null, 'via-body');
    corpo.appendChild(criarTextoComDestaque(conteudo.corpo));

    if (conteudo.extra) {
        const extra = criarElemento('p', null, 'document-extra');
        extra.append(criarElemento('strong', 'CID-10:'), document.createTextNode(` ${conteudo.extra}`));
        corpo.appendChild(extra);
    }

    const rodape = criarElemento('div', null, 'via-footer');
    rodape.appendChild(criarElemento('div', `Sete Lagoas - MG, ${dataDoc}`));

    if (temCarimbo) {
        rodape.appendChild(criarElemento('div', 'Carimbo e Assinatura da Unidade / Profissional', 'stamp-box'));
    }

    const assinatura = criarElemento('div', null, 'signature-box');
    const linha = criarElemento('div', null, 'signature-line');
    const [nomeMedico, crm] = medicoInfo;
    linha.append(document.createTextNode(nomeMedico));
    if (crm) {
        linha.append(document.createElement('br'), document.createTextNode(crm));
    }
    assinatura.appendChild(linha);
    rodape.appendChild(assinatura);

    via.append(cabecalho, corpo, rodape);
    return via;
}

function imagensProntas(container) {
    return Promise.all([...container.querySelectorAll('img')].map(imagem => {
        if (imagem.complete) return Promise.resolve();
        return new Promise(resolve => {
            imagem.addEventListener('load', resolve, { once: true });
            imagem.addEventListener('error', resolve, { once: true });
        });
    }));
}

async function gerarImpressao(event) {
    event.preventDefault();
    const form = document.getElementById('docForm');
    if (!form.reportValidity()) return;

    const tipo = document.getElementById('tipoDoc').value;
    const unidade = document.getElementById('unidade').value || 'ESF CDI 2';
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const dataDoc = formatarData(document.getElementById('dataDoc').value);
    const medicoNome = document.getElementById('medicoNome').value.trim() || 'Profissional Responsável';
    const medicoCrm = document.getElementById('medicoCrm').value.trim();

    let conteudo;
    let medicoInfo;
    let temCarimbo = false;

    if (tipo === 'atestado') {
        const qtdDias = document.getElementById('qtdDias').value;
        const inicio = formatarData(document.getElementById('inicioAfastamento').value);
        const retorno = document.getElementById('previsaoRetorno').value;
        const codigoCid = document.getElementById('codigoCid').value.trim();
        const incluirCid = document.getElementById('exibirCid').checked && codigoCid;
        const autorizado = document.getElementById('autorizaCid').checked;

        const extra = incluirCid ? `${codigoCid} (${autorizado ? 'divulgação expressamente autorizada pelo paciente' : 'autorizada'})` : '';

        conteudo = {
            titulo: 'Atestado Médico',
            corpo: [
                'Atesto para os devidos fins legais, a pedido do(a) interessado(a), que ',
                { destaque: nome },
                ', portador(a) do CPF ',
                { destaque: cpf },
                ', esteve sob atendimento médico nesta unidade de saúde nesta data. Em decorrência do quadro clínico, deverá permanecer afastado(a) de suas atividades laborais e escolares por um período de ',
                { destaque: `${qtdDias} dia(s)` },
                `, a partir de ${inicio}, com previsão de retorno às atividades em ${retorno}.`
            ],
            extra
        };
        medicoInfo = [medicoNome, medicoCrm];
    } else if (tipo === 'declaracao') {
        const hInicio = document.getElementById('horaInicio').value;
        const hFim = document.getElementById('horaFim').value;

        conteudo = {
            titulo: 'Declaração de Comparecimento',
            corpo: [
                'Declaro para os devidos fins de comprovação que ',
                { destaque: nome },
                ', portador(a) do CPF ',
                { destaque: cpf },
                `, esteve presente na unidade de saúde ${unidade} no dia ${dataDoc}, no período das `,
                { destaque: hInicio },
                ' às ',
                { destaque: hFim },
                ' horas, para fins de consulta e atendimento em saúde.'
            ],
            extra: ''
        };
        medicoInfo = ['Profissional / Recepção da Unidade', ''];
        temCarimbo = true;
    } else if (tipo === 'acompanhante') {
        const acompNome = document.getElementById('acompNome').value.trim() || 'Acompanhante';
        const acompCpf = document.getElementById('acompCpf').value.trim() || 'Não informado';
        const acompParentesco = document.getElementById('acompParentesco').value.trim() || 'Acompanhante';
        const hInicio = document.getElementById('acompInicio').value;
        const hFim = document.getElementById('acompFim').value;

        conteudo = {
            titulo: 'Declaração de Acompanhante',
            corpo: [
                'Declaro para os devidos fins de comprovação que ',
                { destaque: acompNome },
                ', portador(a) do CPF ',
                { destaque: acompCpf },
                ` (${acompParentesco}), esteve presente na unidade de saúde ${unidade} no dia ${dataDoc}, no período das `,
                { destaque: hInicio },
                ' às ',
                { destaque: hFim },
                ' horas, exercendo a função de acompanhante do(a) paciente ',
                { destaque: nome },
                ', portador(a) do CPF ',
                { destaque: cpf },
                ', durante a realização de atendimento em saúde.'
            ],
            extra: ''
        };
        medicoInfo = ['Profissional / Recepção da Unidade', ''];
        temCarimbo = true;
    }

    const via = gerarVia(conteudo, unidade, medicoInfo, temCarimbo, dataDoc);
    document.getElementById('printArea').replaceChildren(via, via.cloneNode(true));
    await imagensProntas(document.getElementById('printArea'));

    const nomeArquivo = tipo === 'acompanhante' ? document.getElementById('acompNome').value || nome : nome;
    await baixarPDFEAguardarImpressao(nomeArquivoSeguro(nomeArquivo, tipo), 'l');
}

function limparFormulario() {
    document.getElementById('docForm').reset();
    definirDataHoje(document.getElementById('dataDoc'));
    definirDataHoje(document.getElementById('inicioAfastamento'));
    mudarTipoDoc();
    toggleCid();
}

function carregarParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('nome')) document.getElementById('nome').value = params.get('nome');
    if (params.has('cpf')) document.getElementById('cpf').value = aplicarMascaraCPF(params.get('cpf'));
    if (params.has('nascimento')) document.getElementById('nascimento').value = params.get('nascimento');
    if (params.has('tipo')) {
        document.getElementById('tipoDoc').value = params.get('tipo');
        mudarTipoDoc();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    definirDataHoje(document.getElementById('dataDoc'));
    definirDataHoje(document.getElementById('inicioAfastamento'));

    // Máscaras de CPF
    document.getElementById('cpf').addEventListener('input', (e) => {
        e.target.value = aplicarMascaraCPF(e.target.value);
    });
    document.getElementById('acompCpf').addEventListener('input', (e) => {
        e.target.value = aplicarMascaraCPF(e.target.value);
    });

    document.getElementById('qtdDias').addEventListener('input', atualizarPrevisaoRetorno);
    document.getElementById('inicioAfastamento').addEventListener('input', atualizarPrevisaoRetorno);

    document.getElementById('tipoDoc').addEventListener('change', mudarTipoDoc);
    document.getElementById('exibirCid').addEventListener('change', toggleCid);
    document.getElementById('docForm').addEventListener('submit', gerarImpressao);
    document.querySelector('[data-action="limpar"]').addEventListener('click', limparFormulario);

    mudarTipoDoc();
    carregarParametrosURL();
});
