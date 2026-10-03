const camposRelatorio = {
    paciente: document.getElementById('paciente'),
    nascimento: document.getElementById('nascimento'),
    profissional: document.getElementById('profissional'),
    profissao: document.getElementById('profissao'),
    conselho: document.getElementById('conselho'),
    registro: document.getElementById('registro'),
    dataRelatorio: document.getElementById('dataRelatorio'),
    finalidade: document.getElementById('finalidade'),
    tituloDocumento: document.getElementById('tituloDocumento'),
    relato: document.getElementById('relato'),
    observacoes: document.getElementById('observacoes')
};

function formatarData(data) {
    if (!data) return 'Não informado';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

function criarTextoRotulado(rotulo, valor) {
    const item = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${rotulo}: `;
    item.append(strong, document.createTextNode(valor || 'Não informado'));
    return item;
}

function imagemPronta(imagem) {
    if (imagem.complete) return Promise.resolve();
    return new Promise(resolve => {
        imagem.addEventListener('load', resolve, { once: true });
        imagem.addEventListener('error', resolve, { once: true });
    });
}

async function gerarRelatorio(event) {
    event.preventDefault();
    const form = document.getElementById('reportForm');
    if (!form.reportValidity()) return;
    const paper = document.createElement('article');
    paper.className = 'report-paper';
    const header = document.createElement('header');
    header.className = 'report-institutional';
    const logo = document.createElement('img');
    logo.src = '../assets/logo.png';
    logo.alt = 'Sete Lagoas Prefeitura e Secretaria Municipal da Saúde';
    const unit = document.createElement('div');
    unit.className = 'report-unit';
    unit.append(document.createElement('strong'));
    unit.lastChild.textContent = 'ESF CDI 2';
    unit.append(document.createElement('span'));
    unit.lastChild.textContent = camposRelatorio.tituloDocumento.value;
    header.append(logo, unit);

    const title = document.createElement('div');
    title.className = 'report-title';
    title.append(document.createElement('h1'));
    title.firstChild.textContent = camposRelatorio.tituloDocumento.value;

    const info = document.createElement('div');
    info.className = 'report-info';
    info.append(
        criarTextoRotulado('Paciente', camposRelatorio.paciente.value),
        criarTextoRotulado('Data de nascimento', formatarData(camposRelatorio.nascimento.value)),
        criarTextoRotulado('Profissional', camposRelatorio.profissional.value),
        criarTextoRotulado('Profissão / especialidade', camposRelatorio.profissao.value),
        criarTextoRotulado('Conselho de classe', camposRelatorio.conselho.value),
        criarTextoRotulado('Número do registro', camposRelatorio.registro.value),
        criarTextoRotulado('Data do relatório', formatarData(camposRelatorio.dataRelatorio.value)),
        criarTextoRotulado('Finalidade', camposRelatorio.finalidade.value)
    );

    const atividades = document.createElement('section');
    atividades.className = 'report-block';
    atividades.innerHTML = '<h2>Relato profissional</h2>';
    atividades.append(document.createElement('p'));
    atividades.lastChild.textContent = camposRelatorio.relato.value;

    const observacoes = document.createElement('section');
    observacoes.className = 'report-block';
    observacoes.innerHTML = '<h2>Observações</h2>';
    observacoes.append(document.createElement('p'));
    observacoes.lastChild.textContent = camposRelatorio.observacoes.value || 'Nenhuma observação registrada.';

    const footer = document.createElement('footer');
    footer.className = 'report-footer';
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const dataEmissao = document.createElement('span');
    dataEmissao.textContent = `Sete Lagoas - MG, ${dataAtual}`;
    const assinatura = document.createElement('span');
    assinatura.className = 'report-signature';
    assinatura.textContent = camposRelatorio.profissional.value;
    footer.append(dataEmissao, assinatura);
    paper.append(header, title, info, atividades, observacoes, footer);
    document.getElementById('reportPrint').replaceChildren(paper);
    await imagemPronta(logo);
    await baixarPDFEAguardarImpressao(nomeArquivoSeguro(camposRelatorio.paciente.value, 'relatorio'), 'p');
}

document.getElementById('reportForm').addEventListener('submit', gerarRelatorio);
document.getElementById('limparRelatorio').addEventListener('click', () => document.getElementById('reportForm').reset());
