function formatarData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function definirDataHoje(campo) { campo.valueAsDate = new Date(); }

function mudarTipoDoc() {
    const atestado = document.getElementById('tipoDoc').value === 'atestado';
    document.getElementById('secaoAtestado').style.display = atestado ? 'block' : 'none';
    document.getElementById('secaoDeclaracao').style.display = atestado ? 'none' : 'block';
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
    unidadeMarca.append(criarElemento('strong', unidade), criarElemento('span', 'Secretaria Municipal da Saúde'));
    marca.append(logo, unidadeMarca);
    cabecalho.append(marca, criarElemento('h3', conteudo.titulo));
    const corpo = criarElemento('div', null, 'via-body');
    corpo.appendChild(criarTextoComDestaque(conteudo.corpo));
    if (conteudo.extra) {
        const extra = criarElemento('p', null, 'document-extra');
        extra.append(criarElemento('strong', 'CID:'), document.createTextNode(` ${conteudo.extra}`));
        corpo.appendChild(extra);
    }
    const rodape = criarElemento('div', null, 'via-footer');
    rodape.appendChild(criarElemento('div', `Sete Lagoas - MG, ${dataDoc}`));
    if (temCarimbo) rodape.appendChild(criarElemento('div', 'Carimbo e Assinatura da Unidade / Profissional', 'stamp-box'));
    const assinatura = criarElemento('div', null, 'signature-box');
    const linha = criarElemento('div', null, 'signature-line');
    const [nomeMedico, crm] = medicoInfo;
    linha.append(document.createTextNode(nomeMedico));
    if (crm) linha.append(document.createElement('br'), document.createTextNode(crm));
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
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const dataDoc = formatarData(document.getElementById('dataDoc').value);
    const medicoNome = document.getElementById('medicoNome').value || 'Médico Responsável';
    let conteudo;
    let medicoInfo;
    let temCarimbo = false;

    if (tipo === 'atestado') {
        const qtdDias = document.getElementById('qtdDias').value;
        const inicio = formatarData(document.getElementById('inicioAfastamento').value);
        const codigoCid = document.getElementById('codigoCid').value;
        const incluirCid = document.getElementById('exibirCid').checked && codigoCid;
        const autorizado = document.getElementById('autorizaCid').checked;
        const extra = incluirCid ? `${codigoCid} (${autorizado ? 'divulgação autorizada pelo paciente' : 'mediante expressa autorização do paciente'})` : '';
        conteudo = {
            titulo: 'Atestado Médico',
            corpo: [
                'Atesto para os devidos fins, a pedido do(a) interessado(a), que ', { destaque: nome },
                ', portador(a) do CPF ', { destaque: cpf },
                `, foi submetido(a) a atendimento médico nesta data. Em decorrência, deverá permanecer afastado(a) de suas atividades laborais/escolares por `,
                { destaque: `${qtdDias} dia(s)` }, `, a partir de ${inicio}.`
            ],
            extra
        };
        medicoInfo = [medicoNome, document.getElementById('medicoCrm').value];
    } else {
        const hInicio = document.getElementById('horaInicio').value;
        const hFim = document.getElementById('horaFim').value;
        conteudo = {
            titulo: 'Declaração de Comparecimento',
            corpo: [
                'Declaro para os devidos fins que ', { destaque: nome }, ', portador(a) do CPF ', { destaque: cpf },
                `, esteve comparecendo nesta unidade de saúde (${unidade}) no dia ${dataDoc}, no período das `,
                { destaque: hInicio }, ' às ', { destaque: hFim }, ' horas, para fins de consulta/atendimento médico.'
            ],
            extra: ''
        };
        medicoInfo = ['Profissional Responsável / Recepção', ''];
        temCarimbo = true;
    }

    const via = gerarVia(conteudo, unidade, medicoInfo, temCarimbo, dataDoc);
    document.getElementById('printArea').replaceChildren(via, via.cloneNode(true));
    await imagensProntas(document.getElementById('printArea'));
    window.print();
}

function limparFormulario() {
    document.getElementById('docForm').reset();
    definirDataHoje(document.getElementById('dataDoc'));
    definirDataHoje(document.getElementById('inicioAfastamento'));
    mudarTipoDoc();
    toggleCid();
}

document.addEventListener('DOMContentLoaded', () => {
    definirDataHoje(document.getElementById('dataDoc'));
    document.getElementById('nascimento').valueAsDate = new Date(2000, 0, 1);
    definirDataHoje(document.getElementById('inicioAfastamento'));
    document.getElementById('tipoDoc').addEventListener('change', mudarTipoDoc);
    document.getElementById('exibirCid').addEventListener('change', toggleCid);
    document.getElementById('docForm').addEventListener('submit', gerarImpressao);
    document.querySelector('[data-action="limpar"]').addEventListener('click', limparFormulario);
    mudarTipoDoc();
});
