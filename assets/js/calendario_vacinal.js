/**
 * Calendário Vacinal & Organização de Datas para Puericultura
 * ESF CDI 2 — Sete Lagoas / MG
 */

const DIAS_SEMANA = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
];

// Protocolo de Consultas de Puericultura (Ministério da Saúde / SBP / Caderneta da Criança)
const PROTOCOLO_PUERICULTURA = [
    {
        id: 'rn',
        periodo: '1ª Semana (3º ao 7º dia)',
        tipoAdicao: 'dias',
        valorAdicao: 5,
        fase: 'Recém-Nascido',
        marcos: 'Consulta do RN; Teste do Pezinho (ideal 3º-5º dia), Olhinho, Orelhinha e Coraçãozinho. Avaliação de pega, coto umbilical, icterícia e perda ponderal.',
        vacinas: 'BCG e Hepatite B (ao nascer na maternidade)'
    },
    {
        id: 'm1',
        periodo: '1º Mês (30 dias)',
        tipoAdicao: 'meses',
        valorAdicao: 1,
        fase: 'Lactente jovem',
        marcos: 'Ganho de peso, aleitamento materno exclusivo. Início da Vitamina D profilática (400 UI/dia). Avaliação de reflexos primitivos e fixação visual.',
        vacinas: 'Checar cicatriz BCG e dose Hepatite B'
    },
    {
        id: 'm2',
        periodo: '2º Mês (60 dias)',
        tipoAdicao: 'meses',
        valorAdicao: 2,
        fase: 'Lactente',
        marcos: 'Sorriso social, sustenta a cabeça momentaneamente, emite sons. Orientações sobre cólicas e prevenção de engasgos/morte súbita.',
        vacinas: 'Penta (1ª), VIP (1ª), Pneumo 10 (1ª), Rotavírus (1ª)'
    },
    {
        id: 'm3',
        periodo: '3º Mês (90 dias)',
        tipoAdicao: 'meses',
        valorAdicao: 3,
        fase: 'Lactente',
        marcos: 'Segue objetos a 180°, mãos abertas/interação ativa. Avaliação do perímetro cefálico e curva de crescimento.',
        vacinas: 'Meningocócica C conjugada (1ª dose)'
    },
    {
        id: 'm4',
        periodo: '4º Mês (120 dias)',
        tipoAdicao: 'meses',
        valorAdicao: 4,
        fase: 'Lactente',
        marcos: 'Rola para o lado, alcança brinquedos com as mãos, gargalha. Reforçar aleitamento exclusivo até o 6º mês.',
        vacinas: 'Penta (2ª), VIP (2ª), Pneumo 10 (2ª), Rotavírus (2ª)'
    },
    {
        id: 'm5',
        periodo: '5º Mês (150 dias)',
        tipoAdicao: 'meses',
        valorAdicao: 5,
        fase: 'Lactente',
        marcos: 'Apoio firme nos antebraços, resposta nítida a sons. Acompanhamento de ganho ponderal.',
        vacinas: 'Meningocócica C conjugada (2ª dose)'
    },
    {
        id: 'm6',
        periodo: '6º Mês (180 dias)',
        tipoAdicao: 'meses',
        valorAdicao: 6,
        fase: 'Lactente',
        marcos: 'Início da Introdução Alimentar (comida in natura amassada no garfo), oferta de água. Início do Sulfato Ferroso profilático (1mg/kg/dia). Senta com apoio.',
        vacinas: 'Penta (3ª) e VIP (3ª dose) - Conclusão do esquema primário'
    },
    {
        id: 'm9',
        periodo: '9º Mês (270 dias)',
        tipoAdicao: 'meses',
        valorAdicao: 9,
        fase: 'Lactente',
        marcos: 'Senta sem apoio, engatinha/arrasta, movimento de pinça com os dedos, balbucia ("mama/papa"), estranha desconhecidos. Evolução da consistência alimentar.',
        vacinas: 'Febre Amarela (Dose inicial PNI)'
    },
    {
        id: 'm12',
        periodo: '12º Mês (1 Ano)',
        tipoAdicao: 'meses',
        valorAdicao: 12,
        fase: '1º Aniversário',
        marcos: 'Primeiros passos/fica de pé, aponta o que deseja, primeiras palavras com significado. Transição para refeição da família. Consulta Saúde Bucal UBS.',
        vacinas: 'Tríplice Viral (1ª), Pneumo 10 (Reforço), Meningo C (Reforço)'
    },
    {
        id: 'm18',
        periodo: '18º Mês (1 Ano e 6 Meses)',
        tipoAdicao: 'meses',
        valorAdicao: 18,
        fase: 'Primeira Infância',
        marcos: 'Anda com firmeza, sobe degraus com apoio, vocabulário ativo. Orientação essencial: ZERO TELAS digitais (SBP/OMS recomendam 0 telas até 2 anos).',
        vacinas: 'DTP (1º Reforço), VIP/VOP (1º Reforço), Hepatite A (Única), Tetra Viral'
    },
    {
        id: 'm24',
        periodo: '24º Mês (2 Anos)',
        tipoAdicao: 'meses',
        valorAdicao: 24,
        fase: '2 Anos',
        marcos: 'Frases de 2 palavras, corre, início do desfralde gradual, avaliação do IMC para idade, incentivo a brincadeiras ativas ao ar livre.',
        vacinas: 'Verificar e atualizar pendências da caderneta'
    },
    {
        id: 'a3',
        periodo: '3 Anos',
        tipoAdicao: 'meses',
        valorAdicao: 36,
        fase: 'Pré-escolar',
        marcos: 'Consulta anual de puericultura. Fala fluente, brincadeira simbólica, escovação supervisionada com pasta fluoretada (>1000 ppm), triagem inicial de PA.',
        vacinas: 'Checar esquema vacinal completo'
    },
    {
        id: 'a4',
        periodo: '4 Anos',
        tipoAdicao: 'meses',
        valorAdicao: 48,
        fase: 'Pré-escolar',
        marcos: 'Aferição obrigatória de Pressão Arterial, preparo escolar, interação social com outras crianças, prevenção de acidentes domésticos e no trânsito.',
        vacinas: 'DTP (2º Reforço), VIP/VOP (2º Reforço), Febre Amarela (Reforço), Varicela (2ª dose)'
    },
    {
        id: 'a5',
        periodo: '5 Anos',
        tipoAdicao: 'meses',
        valorAdicao: 60,
        fase: 'Escolar inicial',
        marcos: 'Consulta anual de rotina, teste de acuidade visual com tabela de Snellen, avaliação postural, hábitos saudáveis e sono regular.',
        vacinas: 'Caderneta vacinal completa para ingresso escolar'
    }
];

// Estado dos agendamentos
let cronogramaAtual = [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarAbas();
    inicializarFiltroVacinas();
    inicializarPuericultura();
    lerParametrosURL();
});

// 1. NAVEGAÇÃO DE ABAS
function inicializarAbas() {
    const botoes = document.querySelectorAll('.tab-btn');
    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            botoes.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.guide-section').forEach(sec => sec.classList.remove('active'));

            btn.classList.add('active');
            const targetSection = document.getElementById(targetTab);
            if (targetSection) targetSection.classList.add('active');

            // Atualiza área de impressão ativa
            atualizarFolhaImpressaoAtiva(targetTab);
        });
    });
}

function atualizarFolhaImpressaoAtiva(abaAtiva) {
    const folhaPuericultura = document.getElementById('area-impressao-puericultura');
    const folhaVacinas = document.getElementById('area-impressao-vacinas');

    if (folhaPuericultura && folhaVacinas) {
        if (abaAtiva === 'tab-puericultura') {
            folhaPuericultura.classList.add('active-print');
            folhaVacinas.classList.remove('active-print');
        } else {
            folhaVacinas.classList.add('active-print');
            folhaPuericultura.classList.remove('active-print');
        }
    }
}

// 2. FILTRO DE VACINAS
function inicializarFiltroVacinas() {
    const inputFiltro = document.getElementById('filtroVacina');
    const chips = document.querySelectorAll('.chip[data-filter]');

    function aplicarFiltro() {
        const termo = (inputFiltro ? inputFiltro.value : '').toLowerCase().trim();
        const chipAtivo = document.querySelector('.chip.active')?.dataset.filter || 'todos';
        const linhas = document.querySelectorAll('#tabelaVacinas tbody tr');

        linhas.forEach(linha => {
            const texto = linha.textContent.toLowerCase();
            const grupo = linha.dataset.grupo || '';

            const atendeTermo = !termo || texto.includes(termo);
            const atendeChip = chipAtivo === 'todos' || grupo.includes(chipAtivo);

            linha.style.display = (atendeTermo && atendeChip) ? '' : 'none';
        });
    }

    if (inputFiltro) {
        inputFiltro.addEventListener('input', aplicarFiltro);
    }

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            aplicarFiltro();
        });
    });
}

// 3. PUERICULTURA - CÁLCULOS E CRONOGRAMA
function inicializarPuericultura() {
    const inputNasc = document.getElementById('pueri-nasc');
    if (inputNasc) {
        inputNasc.addEventListener('change', recalcularCronograma);
    }

    // Ouvintes para sincronizar campos do paciente
    const camposPaciente = ['pueri-nome', 'pueri-mae', 'pueri-nasc', 'pueri-cns', 'pueri-prontuario', 'pueri-tel', 'pueri-sexo', 'pueri-obs', 'pueri-prof'];
    camposPaciente.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', sincronizarDadosImpressao);
        }
    });

    // Botões de ação
    document.getElementById('btn-imprimir-pueri')?.addEventListener('click', () => imprimirPuericultura());
    document.getElementById('btn-pdf-pueri')?.addEventListener('click', () => baixarPDFPuericultura());
    document.getElementById('btn-exemplo-pueri')?.addEventListener('click', preencherExemplo);
    document.getElementById('btn-limpar-pueri')?.addEventListener('click', limparFormularioPuericultura);
    document.getElementById('btn-imprimir-vacinas')?.addEventListener('click', () => imprimirVacinas());

    // Se já tiver valor padrão na data de nascimento, calcula
    if (inputNasc && inputNasc.value) {
        recalcularCronograma();
    }
}

// Calcula idade exata detalhada
function calcularIdadeExtenso(dataNascStr) {
    if (!dataNascStr) return '';
    const partes = dataNascStr.split('-');
    if (partes.length !== 3) return '';

    const anoNasc = parseInt(partes[0], 10);
    const mesNasc = parseInt(partes[1], 10) - 1;
    const diaNasc = parseInt(partes[2], 10);

    const dataNasc = new Date(anoNasc, mesNasc, diaNasc);
    const hoje = new Date();

    if (isNaN(dataNasc.getTime()) || dataNasc > hoje) {
        return 'Data futura ou inválida';
    }

    const diffMs = hoje - dataNasc;
    const diasTotais = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diasTotais < 30) {
        return `${diasTotais} ${diasTotais === 1 ? 'dia' : 'dias'} (Recém-Nascido)`;
    }

    let anos = hoje.getFullYear() - dataNasc.getFullYear();
    let meses = hoje.getMonth() - dataNasc.getMonth();
    let dias = hoje.getDate() - dataNasc.getDate();

    if (dias < 0) {
        meses--;
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        dias += mesAnterior.getDate();
    }

    if (meses < 0) {
        anos--;
        meses += 12;
    }

    const partesIdade = [];
    if (anos > 0) partesIdade.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
    if (meses > 0) partesIdade.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
    if (dias > 0 && anos === 0) partesIdade.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);

    return partesIdade.join(', ') || 'Recém-Nascido (hoje)';
}

// Adiciona meses ou dias a uma data base preservando fuso horário
function adicionarIntervalo(dataBaseStr, tipo, valor) {
    const partes = dataBaseStr.split('-');
    const ano = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1;
    const dia = parseInt(partes[2], 10);

    const resultado = new Date(ano, mes, dia);

    if (tipo === 'dias') {
        resultado.setDate(resultado.getDate() + valor);
    } else if (tipo === 'meses') {
        const diaOriginal = resultado.getDate();
        resultado.setMonth(resultado.getMonth() + valor);
        // Tratamento para meses com menos dias
        if (resultado.getDate() !== diaOriginal) {
            resultado.setDate(0); // Último dia do mês correto
        }
    }

    const a = resultado.getFullYear();
    const m = String(resultado.getMonth() + 1).padStart(2, '0');
    const d = String(resultado.getDate()).padStart(2, '0');
    const iso = `${a}-${m}-${d}`;
    const formatada = `${d}/${m}/${a}`;
    const diaSemana = DIAS_SEMANA[resultado.getDay()];

    return { iso, formatada, diaSemana, obj: resultado };
}

// Recalcula datas de todas as consultas com base na data de nascimento
function recalcularCronograma() {
    const dataNasc = document.getElementById('pueri-nasc')?.value;
    const badgeIdade = document.getElementById('badge-idade-atual');
    const tbody = document.getElementById('corpo-tabela-puericultura');

    if (!dataNasc) {
        if (badgeIdade) badgeIdade.textContent = 'Informe a data de nascimento';
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--muted);">Informe a data de nascimento acima para gerar o cronograma de puericultura.</td></tr>';
        sincronizarDadosImpressao();
        return;
    }

    const idadeTexto = calcularIdadeExtenso(dataNasc);
    if (badgeIdade) badgeIdade.textContent = `Idade: ${idadeTexto}`;

    cronogramaAtual = PROTOCOLO_PUERICULTURA.map(item => {
        const calculo = adicionarIntervalo(dataNasc, item.tipoAdicao, item.valorAdicao);
        return {
            ...item,
            dataPrevistaISO: calculo.iso,
            dataPrevistaFormatada: calculo.formatada,
            diaSemana: calculo.diaSemana,
            dataAgendadaISO: calculo.iso, // Inicialmente igual à prevista
            status: 'Prevista',
            medicoes: { peso: '', estatura: '', pc: '' },
            anotacoes: '',
            dataRealizada: '',
            visto: ''
        };
    });

    renderizarTabelaPuericultura();
    sincronizarDadosImpressao();
}

// Renderiza a tabela interativa na tela
function renderizarTabelaPuericultura() {
    const tbody = document.getElementById('corpo-tabela-puericultura');
    if (!tbody) return;

    tbody.innerHTML = '';

    cronogramaAtual.forEach((consulta, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;

        tr.innerHTML = `
            <td class="col-consulta">
                <strong>${consulta.periodo}</strong>
                <span style="display:block; font-size: 0.78rem; color: var(--muted);">${consulta.fase}</span>
            </td>
            <td class="col-data-prev">
                <strong>${consulta.dataPrevistaFormatada}</strong>
                <span class="weekday">${consulta.diaSemana}</span>
            </td>
            <td class="col-agendada">
                <input type="date" class="input-data-agendada" data-idx="${index}" value="${consulta.dataAgendadaISO}">
            </td>
            <td class="col-status">
                <select class="select-status" data-idx="${index}">
                    <option value="Prevista" ${consulta.status === 'Prevista' ? 'selected' : ''}>⏳ Prevista</option>
                    <option value="Agendada" ${consulta.status === 'Agendada' ? 'selected' : ''}>📅 Agendada</option>
                    <option value="Realizada" ${consulta.status === 'Realizada' ? 'selected' : ''}>✅ Realizada</option>
                </select>
            </td>
            <td class="col-marcos">
                <div>${consulta.marcos}</div>
                ${consulta.vacinas ? `<span class="vaccine-tag">💉 Vacinas: ${consulta.vacinas}</span>` : ''}
            </td>
            <td class="col-anotacoes">
                <textarea class="input-anotacoes" data-idx="${index}" placeholder="Peso, Est, PC ou notas...">${consulta.anotacoes}</textarea>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Adiciona ouvintes nos inputs da tabela para sincronizar em tempo real
    tbody.querySelectorAll('.input-data-agendada').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx, 10);
            if (cronogramaAtual[idx]) {
                cronogramaAtual[idx].dataAgendadaISO = e.target.value;
                sincronizarDadosImpressao();
            }
        });
    });

    tbody.querySelectorAll('.select-status').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.idx, 10);
            if (cronogramaAtual[idx]) {
                cronogramaAtual[idx].status = e.target.value;
                sincronizarDadosImpressao();
            }
        });
    });

    tbody.querySelectorAll('.input-anotacoes').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            const idx = parseInt(e.target.dataset.idx, 10);
            if (cronogramaAtual[idx]) {
                cronogramaAtual[idx].anotacoes = e.target.value;
                sincronizarDadosImpressao();
            }
        });
    });
}

// Sincroniza todas as informações na folha de impressão A4
function sincronizarDadosImpressao() {
    const nome = document.getElementById('pueri-nome')?.value.trim() || 'Nome da Criança não informado';
    const mae = document.getElementById('pueri-mae')?.value.trim() || 'Não informada';
    const nasc = document.getElementById('pueri-nasc')?.value || '';
    const cns = document.getElementById('pueri-cns')?.value.trim() || '—';
    const prontuario = document.getElementById('pueri-prontuario')?.value.trim() || '—';
    const tel = document.getElementById('pueri-tel')?.value.trim() || '—';
    const sexo = document.getElementById('pueri-sexo')?.value || '—';
    const obs = document.getElementById('pueri-obs')?.value.trim() || '';
    const prof = document.getElementById('pueri-prof')?.value.trim() || 'Equipe de Saúde da Família';

    const idadeExtenso = calcularIdadeExtenso(nasc);
    let nascFormatado = '—';
    if (nasc) {
        const [a, m, d] = nasc.split('-');
        nascFormatado = `${d}/${m}/${a}`;
    }

    // Identificação no impresso
    const setPrintText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setPrintText('print-pueri-nome', nome);
    setPrintText('print-pueri-mae', mae);
    setPrintText('print-pueri-nasc', nascFormatado);
    setPrintText('print-pueri-idade', idadeExtenso || '—');
    setPrintText('print-pueri-cns', cns);
    setPrintText('print-pueri-prontuario', prontuario);
    setPrintText('print-pueri-tel', tel);
    setPrintText('print-pueri-sexo', sexo);
    setPrintText('print-pueri-prof-assinatura', prof);

    const boxObs = document.getElementById('print-pueri-obs-box');
    const txtObs = document.getElementById('print-pueri-obs');
    if (boxObs && txtObs) {
        if (obs) {
            boxObs.style.display = 'block';
            txtObs.textContent = obs;
        } else {
            boxObs.style.display = 'none';
        }
    }

    // Tabela impressa
    const tbodyPrint = document.getElementById('print-tabela-puericultura-corpo');
    if (!tbodyPrint) return;

    tbodyPrint.innerHTML = '';

    if (cronogramaAtual.length === 0) {
        tbodyPrint.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 15px;">Nenhum cronograma calculado.</td></tr>';
        return;
    }

    cronogramaAtual.forEach(consulta => {
        let dataExibicao = consulta.dataPrevistaFormatada;
        let diaSemanaExibicao = consulta.diaSemana;

        if (consulta.dataAgendadaISO && consulta.dataAgendadaISO !== consulta.dataPrevistaISO) {
            const [a, m, d] = consulta.dataAgendadaISO.split('-');
            dataExibicao = `${d}/${m}/${a}`;
            const dt = new Date(parseInt(a, 10), parseInt(m, 10) - 1, parseInt(d, 10));
            diaSemanaExibicao = DIAS_SEMANA[dt.getDay()];
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="width: 17%; font-weight: 700;">
                ${consulta.periodo}
                <div style="font-size: 7.2pt; font-weight: normal; color: #555;">${consulta.fase}</div>
            </td>
            <td style="width: 15%; text-align: center;">
                <strong>${dataExibicao}</strong>
                <div style="font-size: 7pt; color: #555;">${diaSemanaExibicao}</div>
                <div style="font-size: 6.8pt; color: ${consulta.status === 'Realizada' ? '#166534' : '#0369a1'}; font-weight: bold;">(${consulta.status})</div>
            </td>
            <td style="width: 38%;">
                <div>${consulta.marcos}</div>
                ${consulta.vacinas ? `<div style="font-weight: 700; color: #086b76; font-size: 7.2pt; margin-top: 2px;">💉 Vacinas: ${consulta.vacinas}</div>` : ''}
            </td>
            <td style="width: 16%; font-size: 7.2pt; line-height: 1.4;">
                ${consulta.anotacoes ? consulta.anotacoes.replace(/\n/g, '<br>') : 'Peso: _____ kg<br>Est: _____ cm<br>PC: _____ cm'}
            </td>
            <td style="width: 14%; text-align: center; font-size: 7.2pt;">
                ___/___/_____<br>
                <span style="font-size: 6.5pt; color: #777;">(Data e Visto)</span>
            </td>
        `;
        tbodyPrint.appendChild(tr);
    });
}

// 4. IMPRESSÃO E PDF
function imprimirPuericultura() {
    atualizarFolhaImpressaoAtiva('tab-puericultura');
    sincronizarDadosImpressao();
    window.print();
}

function imprimirVacinas() {
    atualizarFolhaImpressaoAtiva('tab-vacinas');
    window.print();
}

async function baixarPDFPuericultura() {
    atualizarFolhaImpressaoAtiva('tab-puericultura');
    sincronizarDadosImpressao();

    const nomeCrianca = document.getElementById('pueri-nome')?.value || 'crianca';
    const nomeArquivo = typeof nomeArquivoSeguro === 'function'
        ? nomeArquivoSeguro(nomeCrianca, 'cronograma_puericultura')
        : `${nomeCrianca.replace(/\s+/g, '_')}_puericultura.pdf`;

    if (typeof baixarPDFEAguardarImpressao === 'function') {
        await baixarPDFEAguardarImpressao(nomeArquivo, 'p');
    } else {
        window.print();
    }
}

// Preenche dados de exemplo para demonstração rápida
function preencherExemplo() {
    const hoje = new Date();
    // Bebê nascido há 2 meses e 5 dias
    const nasc = new Date(hoje.getFullYear(), hoje.getMonth() - 2, hoje.getDate() - 5);
    const a = nasc.getFullYear();
    const m = String(nasc.getMonth() + 1).padStart(2, '0');
    const d = String(nasc.getDate()).padStart(2, '0');

    document.getElementById('pueri-nome').value = 'Arthur Gabriel Silva dos Santos';
    document.getElementById('pueri-mae').value = 'Mariana Silva dos Santos';
    document.getElementById('pueri-nasc').value = `${a}-${m}-${d}`;
    document.getElementById('pueri-cns').value = '700 8091 2345 0012';
    document.getElementById('pueri-prontuario').value = '10482';
    document.getElementById('pueri-tel').value = '(31) 98877-6655';
    document.getElementById('pueri-sexo').value = 'Masculino';
    document.getElementById('pueri-obs').value = 'Parto normal a termo (39 sem), PN: 3.250g, Est: 49cm, PC: 35cm, Apgar 9/10. Teste do Pezinho coletado no 4º dia.';
    document.getElementById('pueri-prof').value = 'Enfª. Coordenação ESF CDI 2';

    recalcularCronograma();

    // Simula as primeiras consultas realizadas
    if (cronogramaAtual[0]) {
        cronogramaAtual[0].status = 'Realizada';
        cronogramaAtual[0].anotacoes = 'Peso: 3.180g | Est: 49cm | PC: 35cm. Pega adequada, coto limpo.';
    }
    if (cronogramaAtual[1]) {
        cronogramaAtual[1].status = 'Realizada';
        cronogramaAtual[1].anotacoes = 'Peso: 4.100g | Est: 52cm | PC: 37cm. Vitamina D iniciada (400 UI/dia).';
    }
    if (cronogramaAtual[2]) {
        cronogramaAtual[2].status = 'Agendada';
    }

    renderizarTabelaPuericultura();
    sincronizarDadosImpressao();
}

function limparFormularioPuericultura() {
    if (confirm('Deseja limpar todos os dados do cronograma de puericultura?')) {
        ['pueri-nome', 'pueri-mae', 'pueri-nasc', 'pueri-cns', 'pueri-prontuario', 'pueri-tel', 'pueri-obs'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('pueri-sexo').value = 'Masculino';
        cronogramaAtual = [];
        recalcularCronograma();
    }
}

// 5. PARÂMETROS URL (Integração com G-MUS e Extensão)
function lerParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    const nome = params.get('nome') || params.get('paciente');
    const nasc = params.get('nascimento') || params.get('idade');
    const cns = params.get('cns');
    const mae = params.get('mae');

    if (nome || nasc || cns || mae) {
        // Ativa aba de Puericultura
        const btnPueri = document.querySelector('.tab-btn[data-tab="tab-puericultura"]');
        if (btnPueri) btnPueri.click();

        if (nome && document.getElementById('pueri-nome')) {
            document.getElementById('pueri-nome').value = decodeURIComponent(nome);
        }
        if (mae && document.getElementById('pueri-mae')) {
            document.getElementById('pueri-mae').value = decodeURIComponent(mae);
        }
        if (cns && document.getElementById('pueri-cns')) {
            document.getElementById('pueri-cns').value = decodeURIComponent(cns);
        }

        if (nasc && document.getElementById('pueri-nasc')) {
            // Tenta converter se for DD/MM/AAAA para YYYY-MM-DD
            if (nasc.includes('/')) {
                const [d, m, y] = nasc.split('/');
                document.getElementById('pueri-nasc').value = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else {
                document.getElementById('pueri-nasc').value = nasc;
            }
            recalcularCronograma();
        }
    }
}
