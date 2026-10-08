const bancoMedicamentosPadrao = [
    // Anti-hipertensivos e Cardiovasculares
    { nome: "Losartana Potássica", concentracao: "50 mg", forma: "Comprimido" },
    { nome: "Hidroclorotiazida", concentracao: "25 mg", forma: "Comprimido" },
    { nome: "Enalapril (Maleato)", concentracao: "10 mg", forma: "Comprimido" },
    { nome: "Enalapril (Maleato)", concentracao: "20 mg", forma: "Comprimido" },
    { nome: "Captopril", concentracao: "25 mg", forma: "Comprimido" },
    { nome: "Anlodipino (Besilato)", concentracao: "5 mg", forma: "Comprimido" },
    { nome: "Anlodipino (Besilato)", concentracao: "10 mg", forma: "Comprimido" },
    { nome: "Atenolol", concentracao: "50 mg", forma: "Comprimido" },
    { nome: "Propranolol (Cloridrato)", concentracao: "40 mg", forma: "Comprimido" },
    { nome: "Furosemida", concentracao: "40 mg", forma: "Comprimido" },
    { nome: "Espironolactona", concentracao: "25 mg", forma: "Comprimido" },
    { nome: "Metildopa", concentracao: "250 mg", forma: "Comprimido" },
    { nome: "Ácido Acetilsalicílico (AAS)", concentracao: "100 mg", forma: "Comprimido" },
    { nome: "Sinvastatina", concentracao: "20 mg", forma: "Comprimido" },
    { nome: "Sinvastatina", concentracao: "40 mg", forma: "Comprimido" },

    // Hipoglicemiantes / Diabetes
    { nome: "Metformina (Cloridrato)", concentracao: "850 mg", forma: "Comprimido" },
    { nome: "Metformina (Cloridrato)", concentracao: "500 mg", forma: "Comprimido" },
    { nome: "Gliclazida", concentracao: "30 mg", forma: "Comprimido Liberação Prolongada" },
    { nome: "Glibenclamida", concentracao: "5 mg", forma: "Comprimido" },
    { nome: "Insulina Humana NPH", concentracao: "100 UI/mL", forma: "Frasco-ampola ou Caneta" },
    { nome: "Insulina Humana Regular", concentracao: "100 UI/mL", forma: "Frasco-ampola ou Caneta" },

    // Analgésicos e Anti-inflamatórios
    { nome: "Dipirona Monoidratada", concentracao: "500 mg/mL", forma: "Solução Gotas" },
    { nome: "Dipirona Monoidratada", concentracao: "1 g", forma: "Comprimido" },
    { nome: "Dipirona Monoidratada", concentracao: "500 mg", forma: "Comprimido" },
    { nome: "Paracetamol", concentracao: "750 mg", forma: "Comprimido" },
    { nome: "Paracetamol", concentracao: "200 mg/mL", forma: "Solução Gotas" },
    { nome: "Ibuprofeno", concentracao: "600 mg", forma: "Comprimido" },
    { nome: "Ibuprofeno", concentracao: "50 mg/mL", forma: "Suspensão Gotas" },
    { nome: "Diclofenaco de Sódio", concentracao: "50 mg", forma: "Comprimido" },
    { nome: "Nimesulida", concentracao: "100 mg", forma: "Comprimido" },
    { nome: "Cetoprofeno", concentracao: "100 mg", forma: "Comprimido" },
    { nome: "Meloxicam", concentracao: "15 mg", forma: "Comprimido" },

    // Antibióticos
    { nome: "Amoxicilina", concentracao: "500 mg", forma: "Cápsula" },
    { nome: "Amoxicilina", concentracao: "250 mg/5mL", forma: "Suspensão Oral" },
    { nome: "Amoxicilina + Clavulanato de Potássio", concentracao: "875/125 mg", forma: "Comprimido" },
    { nome: "Amoxicilina + Clavulanato de Potássio", concentracao: "250+62,5 mg/5mL", forma: "Suspensão Oral" },
    { nome: "Azitromicina", concentracao: "500 mg", forma: "Comprimido" },
    { nome: "Azitromicina", concentracao: "200 mg/5mL", forma: "Suspensão Oral" },
    { nome: "Cefalexina", concentracao: "500 mg", forma: "Drágea/Comprimido" },
    { nome: "Cefalexina", concentracao: "250 mg/5mL", forma: "Suspensão Oral" },
    { nome: "Ciprofloxacino", concentracao: "500 mg", forma: "Comprimido" },
    { nome: "Sulfametoxazol + Trimetoprima", concentracao: "400+80 mg", forma: "Comprimido" },
    { nome: "Sulfametoxazol + Trimetoprima", concentracao: "200+40 mg/5mL", forma: "Suspensão Oral" },
    { nome: "Metronidazol", concentracao: "250 mg ou 400 mg", forma: "Comprimido" },
    { nome: "Metronidazol Gel Vaginal", concentracao: "100 mg/g", forma: "Tubo c/ aplicadores" },
    { nome: "Nitrofurantoína", concentracao: "100 mg", forma: "Cápsula" },
    { nome: "Doxiciclina", concentracao: "100 mg", forma: "Comprimido" },

    // Respiratório e Antialérgicos
    { nome: "Loratadina", concentracao: "10 mg", forma: "Comprimido" },
    { nome: "Loratadina", concentracao: "1 mg/mL", forma: "Xarope" },
    { nome: "Dexclorfeniramina (Maleato)", concentracao: "2 mg", forma: "Comprimido" },
    { nome: "Dexclorfeniramina (Maleato)", concentracao: "0,4 mg/mL", forma: "Xarope" },
    { nome: "Prednisona", concentracao: "20 mg", forma: "Comprimido" },
    { nome: "Prednisona", concentracao: "5 mg", forma: "Comprimido" },
    { nome: "Prednisolona", concentracao: "3 mg/mL", forma: "Solução Oral" },
    { nome: "Dexametasona", concentracao: "4 mg", forma: "Comprimido" },
    { nome: "Dexametasona", concentracao: "0,1 mg/mL", forma: "Elixir" },
    { nome: "Salbutamol (Sulfato)", concentracao: "100 mcg/dose", forma: "Spray Inalatório" },
    { nome: "Beclometasona (Dipropionato)", concentracao: "250 mcg/dose", forma: "Spray Inalatório" },
    { nome: "Ambroxol (Cloridrato)", concentracao: "30 mg/5mL", forma: "Xarope Adulto" },
    { nome: "Ambroxol (Cloridrato)", concentracao: "15 mg/5mL", forma: "Xarope Pediátrico" },

    // Gastrointestinais
    { nome: "Omeprazol", concentracao: "20 mg", forma: "Cápsula" },
    { nome: "Metoclopramida (Cloridrato)", concentracao: "10 mg", forma: "Comprimido" },
    { nome: "Metoclopramida (Cloridrato)", concentracao: "4 mg/mL", forma: "Solução Gotas" },
    { nome: "Ondansetrona", concentracao: "4 mg ou 8 mg", forma: "Comprimido" },
    { nome: "Simeticona", concentracao: "40 mg", forma: "Comprimido" },
    { nome: "Simeticona", concentracao: "75 mg/mL", forma: "Emulsão Gotas" },
    { nome: "Soro de Reidratação Oral (SRO)", concentracao: "Pó", forma: "Envelope" },
    { nome: "Hidróxido de Alumínio", concentracao: "61,5 mg/mL", forma: "Suspensão Oral" },

    // Tópicos, Pomadas e Oftálmicos
    { nome: "Neomicina + Bacitracina", concentracao: "5 mg + 250 UI/g", forma: "Pomada Tópica" },
    { nome: "Cetoconazol", concentracao: "20 mg/g (2%)", forma: "Creme Tópico" },
    { nome: "Miconazol (Nitrato)", concentracao: "2%", forma: "Creme Tópico ou Vaginal" },
    { nome: "Nistatina", concentracao: "100.000 UI/mL", forma: "Suspensão Oral" },
    { nome: "Nistatina", concentracao: "25.000 UI/g", forma: "Creme Vaginal" },
    { nome: "Sulfadiazina de Prata", concentracao: "10 mg/g (1%)", forma: "Creme Tópico" },
    { nome: "Permetrina", concentracao: "1% ou 5%", forma: "Loção" },
    { nome: "Dexametasona Creme", concentracao: "1 mg/g (0,1%)", forma: "Bisnaga" },
    { nome: "Tobramicina Colírio", concentracao: "0,3%", forma: "Frasco Gotas" },
    { nome: "Carmelose Sódica", concentracao: "0,5%", forma: "Colírio Lubrificante" },

    // Suplementos e Vitaminas
    { nome: "Sulfato Ferroso", concentracao: "40 mg Fe elementar", forma: "Comprimido" },
    { nome: "Sulfato Ferroso", concentracao: "25 mg Fe/mL (125mg/mL)", forma: "Solução Gotas" },
    { nome: "Ácido Fólico", concentracao: "5 mg", forma: "Comprimido" },
    { nome: "Carbonato de Cálcio + Vitamina D", concentracao: "500 mg + 400 UI", forma: "Comprimido" },
    { nome: "Complexo B", concentracao: "Polivitamínico", forma: "Drágea" },

    // Psicotrópicos Comuns na Atenção Básica (Controle Especial)
    { nome: "Fluoxetina (Cloridrato)", concentracao: "20 mg", forma: "Cápsula" },
    { nome: "Sertralina (Cloridrato)", concentracao: "50 mg", forma: "Comprimido" },
    { nome: "Amitriptilina (Cloridrato)", concentracao: "25 mg", forma: "Comprimido" },
    { nome: "Nortriptilina (Cloridrato)", concentracao: "25 mg", forma: "Cápsula" },
    { nome: "Clonazepam", concentracao: "2 mg", forma: "Comprimido" },
    { nome: "Clonazepam", concentracao: "2,5 mg/mL", forma: "Solução Gotas" },
    { nome: "Diazepam", concentracao: "5 mg ou 10 mg", forma: "Comprimido" },
    { nome: "Carbamazepina", concentracao: "200 mg", forma: "Comprimido" },
    { nome: "Haloperidol", concentracao: "1 mg ou 5 mg", forma: "Comprimido" }
];

let receitaAtual = [];
let modeloAtualSelecionado = null;

function obterMedicamentosCompletos() {
    let customizados = [];
    try {
        customizados = JSON.parse(localStorage.getItem('rx_custom_meds')) || [];
    } catch { customizados = []; }
    return [...bancoMedicamentosPadrao, ...customizados];
}

function salvarMedicamentoPessoal() {
    const inputBusca = document.getElementById('med-busca');
    const valor = inputBusca.value.trim();
    if (!valor) {
        alert('Digite o nome do medicamento antes de salvar.');
        inputBusca.focus();
        return;
    }

    let customizados = [];
    try {
        customizados = JSON.parse(localStorage.getItem('rx_custom_meds')) || [];
    } catch { customizados = []; }

    const jaExiste = customizados.some(m => m.nome.toLowerCase() === valor.toLowerCase());
    if (jaExiste) {
        alert('Este medicamento já está na sua lista pessoal.');
        return;
    }

    customizados.push({ nome: valor, concentracao: "Uso conforme posologia", forma: "Personalizado" });
    localStorage.setItem('rx_custom_meds', JSON.stringify(customizados));
    alert(`Medicamento "${valor}" adicionado à sua lista com sucesso!`);
}

function salvarConfiguracoes() {
    const config = {
        medico: document.getElementById('cfg-medico').value,
        esp: document.getElementById('cfg-esp').value,
        crm: document.getElementById('cfg-crm').value
    };
    localStorage.setItem('rx_config', JSON.stringify(config));
    alert('Configurações profissionais salvas com sucesso!');
}

function carregarConfiguracoes() {
    const configSalva = localStorage.getItem('rx_config');
    if (!configSalva) return;
    try {
        const config = JSON.parse(configSalva);
        document.getElementById('cfg-medico').value = config.medico || '';
        document.getElementById('cfg-esp').value = config.esp || '';
        document.getElementById('cfg-crm').value = config.crm || '';
    } catch { alert('Configurações locais inválidas.'); }
}

function obterModelosSalvos() {
    try { return JSON.parse(localStorage.getItem('rx_templates')) || {}; }
    catch { return {}; }
}

function configurarAutocomplete() {
    const input = document.getElementById('med-busca');
    const lista = document.getElementById('autocomplete-list');

    input.addEventListener('input', function () {
        const termo = this.value.toLowerCase().trim();
        lista.replaceChildren();
        modeloAtualSelecionado = null;
        if (!termo) { lista.style.display = 'none'; return; }

        const todosMedicamentos = obterMedicamentosCompletos();
        const filtrados = todosMedicamentos.filter(m => m.nome.toLowerCase().includes(termo));
        if (!filtrados.length) { lista.style.display = 'none'; return; }

        lista.style.display = 'block';
        filtrados.slice(0, 15).forEach(med => {
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
    if (!medNome || !posologia) {
        alert('Preencha o medicamento e as instruções de posologia.');
        return;
    }
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
    if (!receitaAtual.length) {
        alert('Adicione ao menos um medicamento antes de salvar um modelo.');
        return;
    }
    const nomeModelo = document.getElementById('nome-modelo').value.trim();
    if (!nomeModelo) {
        alert('Digite um nome para o modelo (ex: Hipertensão Inicial, Otite Pediátrica).');
        return;
    }
    const modelos = obterModelosSalvos();
    modelos[nomeModelo] = receitaAtual;
    localStorage.setItem('rx_templates', JSON.stringify(modelos));
    document.getElementById('nome-modelo').value = '';
    alert(`Modelo "${nomeModelo}" salvo com sucesso!`);
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

function gerarConteudoVia(numeroVia, isControleEspecial) {
    const via = elemento('div', null, 'via');
    const cabecalho = elemento('div', null, 'print-header');
    const marca = elemento('div', null, 'print-branding');
    const logo = document.createElement('img');
    logo.src = '../assets/logo.png';
    logo.alt = 'Sete Lagoas Prefeitura e Secretaria Municipal da Saúde';

    const tituloReceita = isControleEspecial ? 'Receituário de Controle Especial' : 'Receituário Médico';
    const subtituloVia = isControleEspecial
        ? (numeroVia === 1 ? '1ª VIA: RETENÇÃO DA FARMÁCIA / DROGARIA' : '2ª VIA: ORIENTAÇÃO DO PACIENTE')
        : (numeroVia === 1 ? '1ª VIA — PACIENTE' : '2ª VIA — FARMÁCIA / PRONTUÁRIO');

    const unidadeMarca = elemento('div', null, 'print-branding-unit');
    unidadeMarca.append(elemento('strong', 'ESF CDI 2'), elemento('span', tituloReceita));
    marca.append(logo, unidadeMarca);
    cabecalho.append(marca);

    const subtituloEl = elemento('div', subtituloVia, 'via-subtitle');
    cabecalho.appendChild(subtituloEl);

    // Identificação do Paciente
    const paciente = elemento('div', null, 'print-patient');
    const nome = document.getElementById('pac-nome').value || '_______________________________________';
    const dadosPaciente = [
        ['Paciente:', nome],
        ['Idade / Nasc:', document.getElementById('pac-idade').value],
        ['Endereço:', document.getElementById('pac-end').value]
    ];
    dadosPaciente.forEach(([rotulo, valor]) => {
        if (rotulo !== 'Paciente:' && !valor) return;
        const p = document.createElement('p');
        const strong = elemento('strong', rotulo);
        p.append(strong, document.createTextNode(` ${valor}`));
        paciente.appendChild(p);
    });

    // Itens Prescritos
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

    // Rodapé Profissional
    const rodape = elemento('div', null, 'print-footer');
    const data = new Date();
    const dataFormatada = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
    rodape.appendChild(elemento('div', `Sete Lagoas - MG, ${dataFormatada}`, 'print-date'));
    rodape.appendChild(elemento('div', null, 'signature-line'));
    rodape.appendChild(elemento('p', document.getElementById('cfg-medico').value || 'Nome do Profissional Responsável'));

    const esp = document.getElementById('cfg-esp').value;
    const crm = document.getElementById('cfg-crm').value;
    if (esp && crm) {
        rodape.appendChild(elemento('p', `${esp} — ${crm}`));
    } else if (crm) {
        rodape.appendChild(elemento('p', crm));
    }

    // Se for Controle Especial, anexa os campos legais da Portaria 344/98
    if (isControleEspecial) {
        const boxes = elemento('div', null, 'special-control-boxes');
        
        const boxComprador = elemento('div', null, 'special-box');
        boxComprador.appendChild(elemento('h4', 'Identificação do Comprador'));
        boxComprador.appendChild(elemento('p', 'Nome: ____________________________________'));
        boxComprador.appendChild(elemento('p', 'RG / Órgão: ______________ CPF: ____________'));
        boxComprador.appendChild(elemento('p', 'Endereço: _________________________________'));
        boxComprador.appendChild(elemento('p', 'Cidade / UF: Sete Lagoas/MG Tel: ____________'));

        const boxFornecedor = elemento('div', null, 'special-box');
        boxFornecedor.appendChild(elemento('h4', 'Identificação do Fornecedor'));
        boxFornecedor.appendChild(elemento('p', 'Data do Aviamento: ____ / ____ / ________'));
        boxFornecedor.appendChild(elemento('p', 'Assinatura Farmacêutico(a): ________________'));
        boxFornecedor.appendChild(elemento('p', 'Lote do Medicamento: ______________________'));
        boxFornecedor.appendChild(elemento('p', 'Quantidade Aviada: _______________________'));

        boxes.append(boxComprador, boxFornecedor);
        rodape.appendChild(boxes);
    }

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
        try { coletar(folha.cssRules); } catch { /* ignore */ }
    }
    return regras.join('\n');
}

function proximoQuadro() { return new Promise(resolve => requestAnimationFrame(resolve)); }

function imagensProntas(container) {
    return Promise.all([...container.querySelectorAll('img')].map(imagem => {
        if (imagem.complete) return Promise.resolve();
        return new Promise(resolve => {
            imagem.addEventListener('load', resolve, { once: true });
            imagem.addEventListener('error', resolve, { once: true });
        });
    }));
}

async function prepararImpressao() {
    const isControleEspecial = document.getElementById('tipo-receita').value === 'especial';
    const area = document.getElementById('print-area');
    const vias = [gerarConteudoVia(1, isControleEspecial), gerarConteudoVia(2, isControleEspecial)];
    vias[0].classList.add('via-1');
    vias[1].classList.add('via-2');
    const corte = elemento('div', null, 'cut-line');
    area.replaceChildren(vias[0], corte, vias[1]);
    await imagensProntas(area);

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
        alert('O conteúdo da receita excede o espaço de uma via na folha. Reduza a quantidade de medicamentos ou simplifique as posologias para evitar cortes.');
        return;
    }

    const tipoDocNome = isControleEspecial ? 'receita-controle-especial' : 'receita';
    await baixarPDFEAguardarImpressao(nomeArquivoSeguro(document.getElementById('pac-nome').value, tipoDocNome), 'l');
}

function carregarParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('nome')) document.getElementById('pac-nome').value = params.get('nome');
    if (params.has('idade')) document.getElementById('pac-idade').value = params.get('idade');
    if (params.has('endereco')) document.getElementById('pac-end').value = params.get('endereco');
    if (params.has('tipo')) document.getElementById('tipo-receita').value = params.get('tipo');
}

document.addEventListener('DOMContentLoaded', () => {
    carregarConfiguracoes();
    atualizarDropdownModelos();
    configurarAutocomplete();
    carregarParametrosURL();

    document.querySelector('[data-action="salvar-configuracoes"]').addEventListener('click', salvarConfiguracoes);
    document.querySelector('[data-action="carregar-modelo"]').addEventListener('click', carregarModelo);
    document.querySelector('[data-action="excluir-modelo"]').addEventListener('click', excluirModelo);
    document.querySelector('[data-action="adicionar-medicamento"]').addEventListener('click', adicionarMedicamento);
    document.querySelector('[data-action="salvar-modelo"]').addEventListener('click', salvarModelo);
    document.querySelector('[data-action="imprimir"]').addEventListener('click', prepararImpressao);
    document.getElementById('btn-salvar-novo-med').addEventListener('click', salvarMedicamentoPessoal);
});
