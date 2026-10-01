const bancoMedicamentos = [
    { nome: "Amoxicilina", concentracao: "500 mg", forma: "Cápsula" },
    { nome: "Amoxicilina + Clavulanato de Potássio", concentracao: "875/125 mg", forma: "Comprimido" },
    { nome: "Azitromicina", concentracao: "500 mg", forma: "Comprimido" },
    { nome: "Dipirona Monoidratada", concentracao: "500 mg/mL", forma: "Solução Gotas" },
    { nome: "Dipirona Monoidratada", concentracao: "1 g", forma: "Comprimido" },
    { nome: "Paracetamol", concentracao: "750 mg", forma: "Comprimido" },
    { nome: "Paracetamol", concentracao: "200 mg/mL", forma: "Solução Gotas" },
    { nome: "Ibuprofeno", concentracao: "600 mg", forma: "Comprimido" },
    { nome: "Ibuprofeno", concentracao: "50 mg/mL", forma: "Suspensão Gotas" },
    { nome: "Losartana Potássica", concentracao: "50 mg", forma: "Comprimido" },
    { nome: "Hidroclorotiazida", concentracao: "25 mg", forma: "Comprimido" },
    { nome: "Enalapril (Maleato)", concentracao: "10 mg", forma: "Comprimido" },
    { nome: "Omeprazol", concentracao: "20 mg", forma: "Cápsula" },
    { nome: "Metformina (Cloridrato)", concentracao: "850 mg", forma: "Comprimido" },
    { nome: "Gliclazida", concentracao: "30 mg", forma: "Comprimido Liberação Prolongada" },
    { nome: "Soro de Reidratação Oral", concentracao: "Pó", forma: "Envelope" },
    { nome: "Prednisona", concentracao: "20 mg", forma: "Comprimido" },
    { nome: "Dexametasona", concentracao: "4 mg", forma: "Comprimido" }
];
let receitaAtual = [];
let modeloAtualSelecionado = null;

function salvarConfiguracoes() {
    const config = {
        medico: document.getElementById('cfg-medico').value,
        esp: document.getElementById('cfg-esp').value,
        crm: document.getElementById('cfg-crm').value
    };
    localStorage.setItem('rx_config', JSON.stringify(config));
    alert('Configurações salvas com sucesso!');
}

function carregarConfiguracoes() {
    const configSalva = localStorage.getItem('rx_config');
    if (!configSalva) return;
    try {
        const config = JSON.parse(configSalva);
        document.getElementById('cfg-medico').value = config.medico || '';
        document.getElementById('cfg-esp').value = config.esp || '';
        document.getElementById('cfg-crm').value = config.crm || '';
    } catch { alert('As configurações locais estão inválidas. Salve os dados novamente.'); }
}

function obterModelosSalvos() {
    try { return JSON.parse(localStorage.getItem('rx_templates')) || {}; }
    catch { return {}; }
}

function configurarAutocomplete() {
    const input = document.getElementById('med-busca');
    const lista = document.getElementById('autocomplete-list');
    input.addEventListener('input', function () {
        const termo = this.value.toLowerCase();
        lista.replaceChildren();
        modeloAtualSelecionado = null;
        if (!termo) { lista.style.display = 'none'; return; }
        const filtrados = bancoMedicamentos.filter(m => m.nome.toLowerCase().includes(termo));
        if (!filtrados.length) { lista.style.display = 'none'; return; }
        lista.style.display = 'block';
        filtrados.forEach(med => {
            const li = document.createElement('li');
            const strong = document.createElement('strong');
            const small = document.createElement('small');
            const medTexto = `${med.nome} - ${med.concentracao} (${med.forma})`;
            strong.textContent = med.nome;
            small.textContent = `${med.concentracao} | ${med.forma}`;
            li.append(strong, small);
            li.addEventListener('click', () => {
                input.value = medTexto;
                modeloAtualSelecionado = medTexto;
                lista.style.display = 'none';
                document.getElementById('med-posologia').focus();
            });
            lista.appendChild(li);
        });
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.autocomplete-wrapper')) lista.style.display = 'none';
    });
}

function adicionarMedicamento() {
    const inputBusca = document.getElementById('med-busca');
    const inputPosologia = document.getElementById('med-posologia');
    const medNome = inputBusca.value.trim();
    const posologia = inputPosologia.value.trim();
    if (!medNome || !posologia) { alert('Preencha o medicamento e a posologia.'); return; }
    receitaAtual.push({ med: medNome, pos: posologia });
    inputBusca.value = '';
    inputPosologia.value = '';
    modeloAtualSelecionado = null;
    inputBusca.focus();
    renderizarListaReceita();
}

function removerMedicamento(index) {
    receitaAtual.splice(index, 1);
    renderizarListaReceita();
}

function renderizarListaReceita() {
    const listaEl = document.getElementById('lista-receita');
    const msgEl = document.getElementById('empty-msg');
    listaEl.replaceChildren();
    msgEl.style.display = receitaAtual.length ? 'none' : 'block';
    receitaAtual.forEach((item, index) => {
        const li = document.createElement('li');
        const info = document.createElement('div');
        const nome = document.createElement('strong');
        const posologia = document.createElement('span');
        const remover = document.createElement('button');
        li.className = 'med-item';
        info.className = 'med-item-info';
        nome.textContent = `${index + 1}. ${item.med}`;
        posologia.textContent = `Uso: ${item.pos}`;
        remover.type = 'button';
        remover.className = 'danger remove-med';
        remover.textContent = 'Remover';
        remover.setAttribute('aria-label', `Remover ${item.med}`);
        remover.addEventListener('click', () => removerMedicamento(index));
        info.append(nome, posologia);
        li.append(info, remover);
        listaEl.appendChild(li);
    });
}

function atualizarDropdownModelos() {
    const select = document.getElementById('select-template');
    select.replaceChildren(new Option('-- Selecione um modelo salvo --', ''));
    Object.keys(obterModelosSalvos()).forEach(nome => {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        select.appendChild(opt);
    });
}

function salvarModelo() {
    if (!receitaAtual.length) { alert('Adicione medicamentos à receita antes de salvar um modelo.'); return; }
    const nomeModelo = document.getElementById('nome-modelo').value.trim();
    if (!nomeModelo) { alert('Digite um nome para o modelo.'); return; }
    const modelos = obterModelosSalvos();
    modelos[nomeModelo] = receitaAtual;
    localStorage.setItem('rx_templates', JSON.stringify(modelos));
    document.getElementById('nome-modelo').value = '';
    alert('Modelo salvo com sucesso!');
    atualizarDropdownModelos();
}

function carregarModelo() {
    const nomeSelecionado = document.getElementById('select-template').value;
    const modelos = obterModelosSalvos();
    if (nomeSelecionado && modelos[nomeSelecionado]) {
        receitaAtual = [...modelos[nomeSelecionado]];
        renderizarListaReceita();
    }
}

function excluirModelo() {
    const nomeSelecionado = document.getElementById('select-template').value;
    if (!nomeSelecionado) { alert('Selecione um modelo para excluir.'); return; }
    if (!confirm(`Tem certeza que deseja excluir o modelo "${nomeSelecionado}"?`)) return;
    const modelos = obterModelosSalvos();
    delete modelos[nomeSelecionado];
    localStorage.setItem('rx_templates', JSON.stringify(modelos));
    atualizarDropdownModelos();
}

function elemento(tag, texto, classe) {
    const node = document.createElement(tag);
    if (texto !== undefined && texto !== null) node.textContent = texto;
    if (classe) node.className = classe;
    return node;
}

function gerarConteudoVia() {
    const via = elemento('div', null, 'via');
    const cabecalho = elemento('div', null, 'print-header');
    const marca = elemento('div', null, 'print-branding');
    const logo = document.createElement('img');
    logo.src = '../assets/logo-sete-lagoas.svg';
    logo.alt = 'Sete Lagoas Prefeitura e Secretaria Municipal da Saúde';
    const unidadeMarca = elemento('div', null, 'print-branding-unit');
    unidadeMarca.append(elemento('strong', 'ESF CDI 2'), elemento('span', 'Receituário Médico'));
    marca.append(logo, unidadeMarca);
    cabecalho.append(marca);
    const paciente = elemento('div', null, 'print-patient');
    const nome = document.getElementById('pac-nome').value || '_______________________________________';
    const dadosPaciente = [['Paciente:', nome], ['Idade/Nasc:', document.getElementById('pac-idade').value], ['Endereço:', document.getElementById('pac-end').value]];
    dadosPaciente.forEach(([rotulo, valor]) => {
        if (rotulo !== 'Paciente:' && !valor) return;
        const p = document.createElement('p');
        const strong = elemento('strong', rotulo);
        p.append(strong, document.createTextNode(` ${valor}`));
        paciente.appendChild(p);
    });
    const meds = elemento('div', null, 'print-meds');
    if (receitaAtual.length) {
        receitaAtual.forEach((item, index) => {
            const bloco = elemento('div', null, 'print-med-item');
            bloco.append(elemento('h3', `${index + 1}. ${item.med}`), elemento('p', item.pos));
            meds.appendChild(bloco);
        });
    } else {
        meds.appendChild(elemento('p', '[ Nenhuma prescrição adicionada ]', 'print-empty'));
    }
    const rodape = elemento('div', null, 'print-footer');
    const data = new Date();
    const dataFormatada = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
    rodape.appendChild(elemento('div', `Data: ${dataFormatada}`, 'print-date'));
    rodape.appendChild(elemento('div', null, 'signature-line'));
    rodape.appendChild(elemento('p', document.getElementById('cfg-medico').value || 'Nome do Médico'));
    const esp = document.getElementById('cfg-esp').value;
    const crm = document.getElementById('cfg-crm').value;
    rodape.appendChild(elemento('p', esp && crm ? `${esp} - CRM: ${crm}` : (crm ? `CRM: ${crm}` : '')));
    via.append(cabecalho, paciente, meds, rodape);
    return via;
}

function regrasDeImpressaoParaMedicao() {
    const regras = [];
    function coletar(lista) {
        for (const regra of lista) {
            if (regra.type === CSSRule.MEDIA_RULE) {
                if (regra.conditionText.includes('print')) coletar(regra.cssRules);
            } else if (regra.type !== CSSRule.PAGE_RULE && regra.cssText) regras.push(regra.cssText);
        }
    }
    for (const folha of document.styleSheets) {
        try { coletar(folha.cssRules); } catch { /* folhas externas não são necessárias à medição */ }
    }
    return regras.join('\n');
}

function proximoQuadro() { return new Promise(resolve => requestAnimationFrame(resolve)); }

async function prepararImpressao() {
    const area = document.getElementById('print-area');
    const vias = [gerarConteudoVia(), gerarConteudoVia()];
    vias[0].classList.add('via-1');
    vias[1].classList.add('via-2');
    const corte = elemento('div', null, 'cut-line');
    area.replaceChildren(vias[0], corte, vias[1]);

    const medicao = document.createElement('style');
    medicao.dataset.printMeasurement = 'true';
    medicao.textContent = regrasDeImpressaoParaMedicao();
    document.head.appendChild(medicao);
    document.body.classList.add('print-preview');
    await proximoQuadro();
    await proximoQuadro();
    const excedeu = [...area.querySelectorAll('.via')].some(via => {
        if (via.scrollHeight > via.clientHeight + 2 || via.scrollWidth > via.clientWidth + 2) return true;
        return [...via.querySelectorAll('*')].some(child => child.clientHeight > 0 && (
            child.scrollHeight > child.clientHeight + 2 || child.scrollWidth > child.clientWidth + 2
        ));
    });
    medicao.remove();
    document.body.classList.remove('print-preview');
    if (excedeu) {
        alert('O conteúdo da receita excede o espaço de uma via. Reduza ou revise os dados/posologias e tente novamente; a impressão foi cancelada para evitar cortes.');
        return;
    }
    window.print();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarConfiguracoes();
    atualizarDropdownModelos();
    configurarAutocomplete();
    document.querySelector('[data-action="salvar-configuracoes"]').addEventListener('click', salvarConfiguracoes);
    document.querySelector('[data-action="carregar-modelo"]').addEventListener('click', carregarModelo);
    document.querySelector('[data-action="excluir-modelo"]').addEventListener('click', excluirModelo);
    document.querySelector('[data-action="adicionar-medicamento"]').addEventListener('click', adicionarMedicamento);
    document.querySelector('[data-action="salvar-modelo"]').addEventListener('click', salvarModelo);
    document.querySelector('[data-action="imprimir"]').addEventListener('click', prepararImpressao);
});
