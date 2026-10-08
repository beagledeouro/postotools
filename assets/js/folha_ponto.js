/**
 * Folha de Ponto Online - ESF CDI 2
 * Preenchimento digital, cálculo de calendário, salvamento local e exportação do PDF oficial.
 */

(function () {
    'use strict';

    // Constantes e Nomes dos Meses
    const MESES = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const DIAS_SEMANA_SIGLA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Coordenadas Y para cada dia (01 a 31) no PDF oficial
    const Y_COORDS = {
        1: [589.5, 599.5], 2: [578.5, 587.5], 3: [567.5, 576.5], 4: [555.5, 565.5],
        5: [544.5, 553.5], 6: [532.5, 542.5], 7: [521.5, 530.5], 8: [509.5, 519.5],
        9: [498.5, 507.5], 10: [486.5, 496.5], 11: [475.5, 484.5], 12: [464.5, 473.5],
        13: [452.5, 462.5], 14: [441.5, 450.5], 15: [429.5, 439.5], 16: [418.5, 427.5],
        17: [406.5, 416.5], 18: [395.5, 404.5], 19: [383.5, 393.5], 20: [372.5, 381.5],
        21: [361.5, 370.5], 22: [349.5, 359.5], 23: [338.5, 347.5], 24: [326.5, 336.5],
        25: [315.5, 324.5], 26: [303.5, 313.5], 27: [292.5, 301.5], 28: [280.5, 290.5],
        29: [269.5, 278.5], 30: [257.5, 267.5], 31: [246.5, 255.5]
    };

    // Coordenadas X para as colunas de cada dia
    const X_COORDS = {
        entrada: [98.5, 180.5],
        local_entrada: [182.5, 259.5],
        almoco_inicio: [261.5, 339.5],
        almoco_fim: [341.5, 418.5],
        saida: [420.5, 498.5],
        local_saida: [500.5, 577.5]
    };

    // Coordenadas dos campos de cabeçalho
    const HEADER_COORDS = {
        dia: [390.0, 694.5, 424.9, 707.5],
        mes_data: [439.6, 694.5, 524.3, 707.5],
        nome_funcionario: [108.3, 646.5, 252.7, 659.0],
        matricula: [299.6, 646.5, 354.4, 659.0],
        mes_referencia: [88.3, 632.5, 177.9, 645.0]
    };

    // Configurações e Estado
    let anoAtual = 2026;
    let mesAtualIndex = new Date().getMonth(); // 0 a 11
    let pdfBlobUrlAtual = null;

    // Referências aos Elementos DOM
    const elNome = document.getElementById('nomeFuncionario');
    const elMatricula = document.getElementById('matriculaFuncionario');
    const elMesRef = document.getElementById('mesReferencia');
    const elAnoRef = document.getElementById('anoReferencia');
    const elDiaEmissao = document.getElementById('diaEmissao');
    const elMesEmissao = document.getElementById('mesEmissao');
    const elLocalPadrao = document.getElementById('localPadrao');

    // Horários Padrão
    const elStdEntrada = document.getElementById('stdEntrada');
    const elStdAlmocoInicio = document.getElementById('stdAlmocoInicio');
    const elStdAlmocoFim = document.getElementById('stdAlmocoFim');
    const elStdSaida = document.getElementById('stdSaida');

    // Tabela e Contadores
    const tabelaCorpo = document.getElementById('diasTableBody');
    const elTotalDiasUteis = document.getElementById('totalDiasUteis');
    const elTotalPreenchidos = document.getElementById('totalPreenchidos');

    // Modal
    const modalPdf = document.getElementById('modalPreviewPdf');
    const modalIframe = document.getElementById('pdfPreviewFrame');
    const btnFecharModal = document.getElementById('fecharModalPdf');
    const btnDownloadModal = document.getElementById('btnDownloadModal');
    const btnImprimirModal = document.getElementById('btnImprimirModal');

    // Toast
    const toast = document.getElementById('toastMsg');

    function exibirToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // Inicialização de Meses nos Selects
    function inicializarSelects() {
        const hoje = new Date();
        const diaHoje = hoje.getDate();
        const mesHojeIndex = hoje.getMonth();
        const anoHoje = hoje.getFullYear();

        // Se estivermos em 2026, mantém; se não, usa o ano atual
        if (elAnoRef) {
            elAnoRef.value = anoHoje >= 2026 ? anoHoje : 2026;
            anoAtual = parseInt(elAnoRef.value, 10);
        }

        // Mês de Referência
        if (elMesRef) {
            elMesRef.innerHTML = '';
            MESES.forEach((mes, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = `${mes} de ${anoAtual}`;
                if (idx === mesHojeIndex) opt.selected = true;
                elMesRef.appendChild(opt);
            });
            mesAtualIndex = parseInt(elMesRef.value, 10);
        }

        // Dia de Emissão
        if (elDiaEmissao) {
            elDiaEmissao.value = String(diaHoje).padStart(2, '0');
        }

        // Mês de Emissão
        if (elMesEmissao) {
            elMesEmissao.innerHTML = '';
            MESES.forEach((mes, idx) => {
                const opt = document.createElement('option');
                opt.value = mes;
                opt.textContent = mes;
                if (idx === mesHojeIndex) opt.selected = true;
                elMesEmissao.appendChild(opt);
            });
        }
    }

    // Carregar preferências salvas no LocalStorage
    function carregarDadosSalvos() {
        try {
            const salvoNome = localStorage.getItem('esf_folha_nome');
            const salvoMatricula = localStorage.getItem('esf_folha_matricula');
            const salvoLocal = localStorage.getItem('esf_folha_local');
            const salvoStdEntrada = localStorage.getItem('esf_folha_std_entrada');
            const salvoStdAlmocoIni = localStorage.getItem('esf_folha_std_almoco_ini');
            const salvoStdAlmocoFim = localStorage.getItem('esf_folha_std_almoco_fim');
            const salvoStdSaida = localStorage.getItem('esf_folha_std_saida');

            if (salvoNome && elNome) elNome.value = salvoNome;
            if (salvoMatricula && elMatricula) elMatricula.value = salvoMatricula;
            if (salvoLocal && elLocalPadrao) elLocalPadrao.value = salvoLocal;
            if (salvoStdEntrada && elStdEntrada) elStdEntrada.value = salvoStdEntrada;
            if (salvoStdAlmocoIni && elStdAlmocoInicio) elStdAlmocoInicio.value = salvoStdAlmocoIni;
            if (salvoStdAlmocoFim && elStdAlmocoFim) elStdAlmocoFim.value = salvoStdAlmocoFim;
            if (salvoStdSaida && elStdSaida) elStdSaida.value = salvoStdSaida;
        } catch (e) {
            console.warn('LocalStorage indisponível:', e);
        }
    }

    // Salvar preferências no LocalStorage
    function salvarDadosUsuario() {
        try {
            if (elNome) localStorage.setItem('esf_folha_nome', elNome.value.trim());
            if (elMatricula) localStorage.setItem('esf_folha_matricula', elMatricula.value.trim());
            if (elLocalPadrao) localStorage.setItem('esf_folha_local', elLocalPadrao.value.trim());
            if (elStdEntrada) localStorage.setItem('esf_folha_std_entrada', elStdEntrada.value.trim());
            if (elStdAlmocoInicio) localStorage.setItem('esf_folha_std_almoco_ini', elStdAlmocoInicio.value.trim());
            if (elStdAlmocoFim) localStorage.setItem('esf_folha_std_almoco_fim', elStdAlmocoFim.value.trim());
            if (elStdSaida) localStorage.setItem('esf_folha_std_saida', elStdSaida.value.trim());
        } catch (e) {
            console.warn('Erro ao salvar no LocalStorage:', e);
        }
    }

    // Determinar informações dos dias do mês
    function obterInfoDiasDoMes(ano, mesIndex) {
        const dias = [];
        let totalUteis = 0;

        for (let dia = 1; dia <= 31; dia++) {
            const dataObj = new Date(ano, mesIndex, dia);
            const pertence = (dataObj.getMonth() === mesIndex);
            const diaSemanaIdx = dataObj.getDay(); // 0 = Dom, 6 = Sáb
            const ehFds = (diaSemanaIdx === 0 || diaSemanaIdx === 6);
            const ehUtil = (pertence && !ehFds);

            if (ehUtil) totalUteis++;

            dias.push({
                dia,
                diaFormatado: String(dia).padStart(2, '0'),
                pertenceAoMes: pertence,
                diaSemanaSigla: DIAS_SEMANA_SIGLA[diaSemanaIdx],
                ehFds,
                ehUtil
            });
        }

        return { dias, totalUteis };
    }

    // Renderizar a tabela dos 31 dias
    function renderizarTabelaDias() {
        if (!tabelaCorpo) return;

        // Guardar valores atuais dos inputs antes de recriar a tabela
        const valoresExistentes = {};
        for (let i = 1; i <= 31; i++) {
            const pad = String(i).padStart(2, '0');
            valoresExistentes[pad] = {
                entrada: document.getElementById(`entrada_${pad}`)?.value || '',
                local_entrada: document.getElementById(`local_entrada_${pad}`)?.value || '',
                almoco_inicio: document.getElementById(`almoco_inicio_${pad}`)?.value || '',
                almoco_fim: document.getElementById(`almoco_fim_${pad}`)?.value || '',
                saida: document.getElementById(`saida_${pad}`)?.value || '',
                local_saida: document.getElementById(`local_saida_${pad}`)?.value || '',
            };
        }

        const { dias, totalUteis } = obterInfoDiasDoMes(anoAtual, mesAtualIndex);
        if (elTotalDiasUteis) elTotalDiasUteis.textContent = totalUteis;

        const hoje = new Date();
        const hojeDia = hoje.getDate();
        const hojeMes = hoje.getMonth();
        const hojeAno = hoje.getFullYear();

        tabelaCorpo.innerHTML = '';

        dias.forEach(item => {
            const pad = item.diaFormatado;
            const tr = document.createElement('tr');
            if (item.ehFds) tr.classList.add('row-weekend');
            if (!item.pertenceAoMes) tr.classList.add('row-disabled');

            const ehHoje = (hojeDia === item.dia && hojeMes === mesAtualIndex && hojeAno === anoAtual);
            const classeBadge = item.ehFds ? 'dia-semana fds' : (ehHoje ? 'dia-semana hoje' : 'dia-semana');

            const val = valoresExistentes[pad] || {};

            tr.innerHTML = `
                <td>
                    <div class="dia-badge-wrapper" title="${item.pertenceAoMes ? '' : 'Dia não pertence a este mês'}">
                        <span class="dia-num">${pad}</span>
                        <span class="${classeBadge}">${item.diaSemanaSigla}</span>
                    </div>
                </td>
                <td>
                    <input type="text" id="entrada_${pad}" name="entrada_${pad}" class="input-hora" 
                           placeholder="07:00" maxlength="5" value="${escapeHtml(val.entrada)}">
                </td>
                <td>
                    <input type="text" id="local_entrada_${pad}" name="local_entrada_${pad}" class="input-local" 
                           placeholder="ESF CDI 2" value="${escapeHtml(val.local_entrada)}">
                </td>
                <td>
                    <input type="text" id="almoco_inicio_${pad}" name="almoco_inicio_${pad}" class="input-hora" 
                           placeholder="11:00" maxlength="5" value="${escapeHtml(val.almoco_inicio)}">
                </td>
                <td>
                    <input type="text" id="almoco_fim_${pad}" name="almoco_fim_${pad}" class="input-hora" 
                           placeholder="12:00" maxlength="5" value="${escapeHtml(val.almoco_fim)}">
                </td>
                <td>
                    <input type="text" id="saida_${pad}" name="saida_${pad}" class="input-hora" 
                           placeholder="16:00" maxlength="5" value="${escapeHtml(val.saida)}">
                </td>
                <td>
                    <input type="text" id="local_saida_${pad}" name="local_saida_${pad}" class="input-local" 
                           placeholder="ESF CDI 2" value="${escapeHtml(val.local_saida)}">
                </td>
                <td>
                    <div class="row-actions">
                        <button type="button" class="btn-row-action btn-copiar-linha" data-dia="${pad}" title="Preencher com horário padrão">⚡ Padrão</button>
                        <button type="button" class="btn-row-action btn-folga-linha" data-dia="${pad}" title="Marcar como folga">Folga</button>
                        <button type="button" class="btn-row-action btn-limpar-linha" data-dia="${pad}" title="Limpar linha">✕</button>
                    </div>
                </td>
            `;

            tabelaCorpo.appendChild(tr);
        });

        vincularEventosLinhas();
        atualizarContadores();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Autoformatação de horas (ex: digitar 0700 -> 07:00)
    function autoFormatarHora(input) {
        let val = input.value.replace(/\D/g, '');
        if (val.length >= 3) {
            val = val.slice(0, 2) + ':' + val.slice(2, 4);
        }
        input.value = val;
    }

    function vincularEventosLinhas() {
        // Máscara e contadores nos inputs
        const inputsHora = tabelaCorpo.querySelectorAll('.input-hora');
        inputsHora.forEach(inp => {
            inp.addEventListener('input', () => {
                autoFormatarHora(inp);
                atualizarContadores();
            });
        });

        // Botões de linha
        tabelaCorpo.querySelectorAll('.btn-copiar-linha').forEach(btn => {
            btn.addEventListener('click', () => {
                const dia = btn.dataset.dia;
                preencherLinhaComPadrao(dia);
                atualizarContadores();
            });
        });

        tabelaCorpo.querySelectorAll('.btn-folga-linha').forEach(btn => {
            btn.addEventListener('click', () => {
                const dia = btn.dataset.dia;
                limparLinha(dia);
                const locEnt = document.getElementById(`local_entrada_${dia}`);
                if (locEnt) locEnt.value = 'FOLGA';
                atualizarContadores();
            });
        });

        tabelaCorpo.querySelectorAll('.btn-limpar-linha').forEach(btn => {
            btn.addEventListener('click', () => {
                const dia = btn.dataset.dia;
                limparLinha(dia);
                atualizarContadores();
            });
        });
    }

    function preencherLinhaComPadrao(diaPad) {
        const local = elLocalPadrao?.value.trim() || 'ESF CDI 2';
        const ent = elStdEntrada?.value.trim() || '07:00';
        const almIni = elStdAlmocoInicio?.value.trim() || '11:00';
        const almFim = elStdAlmocoFim?.value.trim() || '12:00';
        const sai = elStdSaida?.value.trim() || '16:00';

        const elEnt = document.getElementById(`entrada_${diaPad}`);
        const elLocEnt = document.getElementById(`local_entrada_${diaPad}`);
        const elAlmIni = document.getElementById(`almoco_inicio_${diaPad}`);
        const elAlmFim = document.getElementById(`almoco_fim_${diaPad}`);
        const elSai = document.getElementById(`saida_${diaPad}`);
        const elLocSai = document.getElementById(`local_saida_${diaPad}`);

        if (elEnt) elEnt.value = ent;
        if (elLocEnt) elLocEnt.value = local;
        if (elAlmIni) elAlmIni.value = almIni;
        if (elAlmFim) elAlmFim.value = almFim;
        if (elSai) elSai.value = sai;
        if (elLocSai) elLocSai.value = local;
    }

    function limparLinha(diaPad) {
        const elEnt = document.getElementById(`entrada_${diaPad}`);
        const elLocEnt = document.getElementById(`local_entrada_${diaPad}`);
        const elAlmIni = document.getElementById(`almoco_inicio_${diaPad}`);
        const elAlmFim = document.getElementById(`almoco_fim_${diaPad}`);
        const elSai = document.getElementById(`saida_${diaPad}`);
        const elLocSai = document.getElementById(`local_saida_${diaPad}`);

        if (elEnt) elEnt.value = '';
        if (elLocEnt) elLocEnt.value = '';
        if (elAlmIni) elAlmIni.value = '';
        if (elAlmFim) elAlmFim.value = '';
        if (elSai) elSai.value = '';
        if (elLocSai) elLocSai.value = '';
    }

    function atualizarContadores() {
        let preenchidos = 0;
        for (let i = 1; i <= 31; i++) {
            const pad = String(i).padStart(2, '0');
            const ent = document.getElementById(`entrada_${pad}`)?.value.trim();
            const sai = document.getElementById(`saida_${pad}`)?.value.trim();
            const loc = document.getElementById(`local_entrada_${pad}`)?.value.trim();
            if (ent || sai || (loc && loc !== 'FOLGA')) {
                preenchidos++;
            }
        }
        if (elTotalPreenchidos) elTotalPreenchidos.textContent = preenchidos;
    }

    // Ações em Lote
    function preencherDiasUteis() {
        const { dias } = obterInfoDiasDoMes(anoAtual, mesAtualIndex);
        dias.forEach(item => {
            const pad = item.diaFormatado;
            if (item.ehUtil) {
                preencherLinhaComPadrao(pad);
            } else {
                limparLinha(pad);
            }
        });
        atualizarContadores();
        exibirToast('Dias úteis do mês preenchidos com o horário padrão!');
    }

    function preencherTodosOsDias() {
        for (let i = 1; i <= 31; i++) {
            preencherLinhaComPadrao(String(i).padStart(2, '0'));
        }
        atualizarContadores();
        exibirToast('Todos os 31 dias foram preenchidos com o horário padrão.');
    }

    function limparFinaisDeSemana() {
        const { dias } = obterInfoDiasDoMes(anoAtual, mesAtualIndex);
        let alterados = 0;
        dias.forEach(item => {
            if (item.ehFds || !item.pertenceAoMes) {
                limparLinha(item.diaFormatado);
                alterados++;
            }
        });
        atualizarContadores();
        exibirToast('Sábados, domingos e dias fora do mês foram limpos.');
    }

    function limparTodosOsDias() {
        if (!confirm('Deseja limpar todos os horários preenchidos da tabela?')) return;
        for (let i = 1; i <= 31; i++) {
            limparLinha(String(i).padStart(2, '0'));
        }
        atualizarContadores();
        exibirToast('Tabela de horários reiniciada.');
    }

    // Aplicar Presets de Carga Horária
    function aplicarPreset(tipo) {
        if (tipo === '40h_manha') {
            if (elStdEntrada) elStdEntrada.value = '07:00';
            if (elStdAlmocoInicio) elStdAlmocoInicio.value = '11:00';
            if (elStdAlmocoFim) elStdAlmocoFim.value = '12:00';
            if (elStdSaida) elStdSaida.value = '16:00';
        } else if (tipo === '40h_tarde') {
            if (elStdEntrada) elStdEntrada.value = '08:00';
            if (elStdAlmocoInicio) elStdAlmocoInicio.value = '12:00';
            if (elStdAlmocoFim) elStdAlmocoFim.value = '13:00';
            if (elStdSaida) elStdSaida.value = '17:00';
        } else if (tipo === '30h') {
            if (elStdEntrada) elStdEntrada.value = '07:00';
            if (elStdAlmocoInicio) elStdAlmocoInicio.value = '';
            if (elStdAlmocoFim) elStdAlmocoFim.value = '';
            if (elStdSaida) elStdSaida.value = '13:00';
        } else if (tipo === '20h') {
            if (elStdEntrada) elStdEntrada.value = '07:00';
            if (elStdAlmocoInicio) elStdAlmocoInicio.value = '';
            if (elStdAlmocoFim) elStdAlmocoFim.value = '';
            if (elStdSaida) elStdSaida.value = '11:00';
        }

        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        const btnAtivo = document.querySelector(`.preset-btn[data-preset="${tipo}"]`);
        if (btnAtivo) btnAtivo.classList.add('active');

        salvarDadosUsuario();
        exibirToast(`Preset aplicado: ${tipo.replace('_', ' ').toUpperCase()}`);
    }

    // Carregar Modelo do PDF (Base64 offline ou fetch HTTP)
    async function carregarModeloPdfBytes() {
        if (window.FOLHA_PONTO_BASE64) {
            const binString = atob(window.FOLHA_PONTO_BASE64);
            const bytes = new Uint8Array(binString.length);
            for (let i = 0; i < binString.length; i++) {
                bytes[i] = binString.charCodeAt(i);
            }
            return bytes;
        }

        const resp = await fetch('Folha_de_Ponto_Preenchivel.pdf');
        if (!resp.ok) {
            throw new Error('Não foi possível carregar o arquivo Folha_de_Ponto_Preenchivel.pdf');
        }
        return new Uint8Array(await resp.arrayBuffer());
    }

    // Coleta dos dados do formulário
    function coletarDadosFormulario() {
        const nome = (elNome?.value || '').trim();
        const matricula = (elMatricula?.value || '').trim();
        const mesRefTexto = MESES[mesAtualIndex].toUpperCase();
        const diaEmissao = (elDiaEmissao?.value || '').trim();
        const mesEmissao = (elMesEmissao?.value || '').trim();

        const dias = {};
        for (let i = 1; i <= 31; i++) {
            const pad = String(i).padStart(2, '0');
            dias[pad] = {
                entrada: (document.getElementById(`entrada_${pad}`)?.value || '').trim(),
                local_entrada: (document.getElementById(`local_entrada_${pad}`)?.value || '').trim(),
                almoco_inicio: (document.getElementById(`almoco_inicio_${pad}`)?.value || '').trim(),
                almoco_fim: (document.getElementById(`almoco_fim_${pad}`)?.value || '').trim(),
                saida: (document.getElementById(`saida_${pad}`)?.value || '').trim(),
                local_saida: (document.getElementById(`local_saida_${pad}`)?.value || '').trim()
            };
        }

        return {
            nome,
            matricula,
            mesRefTexto,
            diaEmissao,
            mesEmissao,
            ano: anoAtual,
            dias
        };
    }

    // Gerar o PDF Preenchido usando PDF-Lib
    async function gerarPdfBytes(dados) {
        if (typeof PDFLib === 'undefined') {
            throw new Error('A biblioteca PDFLib não está carregada.');
        }

        const modeloBytes = await carregarModeloPdfBytes();
        const pdfDoc = await PDFLib.PDFDocument.load(modeloBytes);

        const fonteRegular = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const fonteNegrito = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const pagina = pdfDoc.getPages()[0];
        const form = pdfDoc.getForm();
        const corTexto = PDFLib.rgb(0.08, 0.08, 0.08);

        // Função auxiliar para desenhar texto perfeitamente centralizado em uma bounding box
        function desenharTextoEmBBox(texto, [x1, y1, x2, y2], fonte = fonteRegular, tamanho = 8) {
            if (!texto) return;
            const textoStr = String(texto).trim();
            if (!textoStr) return;

            // Ajustar tamanho se o texto for maior que a largura
            let tamanhoAjustado = tamanho;
            let larguraTexto = fonte.widthOfTextAtSize(textoStr, tamanhoAjustado);
            const larguraBox = x2 - x1;

            if (larguraTexto > larguraBox - 4) {
                tamanhoAjustado = Math.max(6, (larguraBox - 4) / (larguraTexto / tamanhoAjustado));
                larguraTexto = fonte.widthOfTextAtSize(textoStr, tamanhoAjustado);
            }

            const alturaFonte = fonte.heightAtSize(tamanhoAjustado);
            const posX = x1 + Math.max(1, (larguraBox - larguraTexto) / 2);
            const posY = y1 + Math.max(1, (y2 - y1 - alturaFonte * 0.75) / 2);

            pagina.drawText(textoStr, {
                x: posX,
                y: posY,
                size: tamanhoAjustado,
                font: fonte,
                color: corTexto
            });
        }

        // Função para preencher campo do formulário e desenhar texto
        function preencherEDesenhar(campoNome, valor, bbox, fonte = fonteRegular, tamanho = 8) {
            if (!valor) return;
            const valorStr = String(valor).trim();
            if (!valorStr) return;

            try {
                const tf = form.getTextField(campoNome);
                if (tf) tf.setText(valorStr);
            } catch (e) {
                // Silencioso se o campo AcroForm não aceitar
            }

            if (bbox) {
                desenharTextoEmBBox(valorStr, bbox, fonte, tamanho);
            }
        }

        // 1. Cabeçalho
        preencherEDesenhar('dia', dados.diaEmissao, HEADER_COORDS.dia, fonteNegrito, 9.5);
        preencherEDesenhar('mes_data', dados.mesEmissao, HEADER_COORDS.mes_data, fonteNegrito, 9.5);
        preencherEDesenhar('nome_funcionario', dados.nome, HEADER_COORDS.nome_funcionario, fonteNegrito, 9);
        preencherEDesenhar('matricula', dados.matricula, HEADER_COORDS.matricula, fonteNegrito, 9);
        preencherEDesenhar('mes_referencia', dados.mesRefTexto, HEADER_COORDS.mes_referencia, fonteNegrito, 9);

        // 2. Tabela de 31 dias
        for (let i = 1; i <= 31; i++) {
            const pad = String(i).padStart(2, '0');
            const diaInfo = dados.dias[pad] || {};
            const [y1, y2] = Y_COORDS[i];

            if (diaInfo.entrada) {
                preencherEDesenhar(`entrada_${pad}`, diaInfo.entrada, [X_COORDS.entrada[0], y1, X_COORDS.entrada[1], y2], fonteRegular, 8);
            }
            if (diaInfo.local_entrada) {
                preencherEDesenhar(`local_entrada_${pad}`, diaInfo.local_entrada, [X_COORDS.local_entrada[0], y1, X_COORDS.local_entrada[1], y2], fonteRegular, 7.5);
            }
            if (diaInfo.almoco_inicio) {
                preencherEDesenhar(`almoco_inicio_${pad}`, diaInfo.almoco_inicio, [X_COORDS.almoco_inicio[0], y1, X_COORDS.almoco_inicio[1], y2], fonteRegular, 8);
            }
            if (diaInfo.almoco_fim) {
                preencherEDesenhar(`almoco_fim_${pad}`, diaInfo.almoco_fim, [X_COORDS.almoco_fim[0], y1, X_COORDS.almoco_fim[1], y2], fonteRegular, 8);
            }
            if (diaInfo.saida) {
                preencherEDesenhar(`saida_${pad}`, diaInfo.saida, [X_COORDS.saida[0], y1, X_COORDS.saida[1], y2], fonteRegular, 8);
            }
            if (diaInfo.local_saida) {
                preencherEDesenhar(`local_saida_${pad}`, diaInfo.local_saida, [X_COORDS.local_saida[0], y1, X_COORDS.local_saida[1], y2], fonteRegular, 7.5);
            }
        }

        return await pdfDoc.save();
    }

    // Gerar nome de arquivo seguro
    function gerarNomeArquivo(dados) {
        const nomeLimpo = (dados.nome || 'servidor')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toLowerCase();
        const mesLimpo = dados.mesRefTexto.toLowerCase();
        return `folha_de_ponto_${nomeLimpo}_${mesLimpo}_${dados.ano}.pdf`;
    }

    // Ação: Baixar PDF Preenchido
    async function baixarPdfPreenchido() {
        const dados = coletarDadosFormulario();
        if (!dados.nome) {
            alert('Por favor, informe o Nome do Funcionário antes de baixar a folha de ponto.');
            if (elNome) elNome.focus();
            return;
        }

        salvarDadosUsuario();
        exibirToast('Gerando PDF da folha de ponto...');

        try {
            const pdfBytes = await gerarPdfBytes(dados);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const nomeArquivo = gerarNomeArquivo(dados);

            const link = document.createElement('a');
            link.href = url;
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(url), 60000);
            exibirToast(`Download concluído: ${nomeArquivo}`);
        } catch (erro) {
            console.error('Erro ao gerar PDF:', erro);
            alert('Erro ao gerar o PDF da folha de ponto: ' + erro.message);
        }
    }

    // Ação: Pré-visualizar PDF em Modal
    async function previsualizarPdf() {
        const dados = coletarDadosFormulario();
        salvarDadosUsuario();
        exibirToast('Carregando pré-visualização...');

        try {
            const pdfBytes = await gerarPdfBytes(dados);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            if (pdfBlobUrlAtual) {
                URL.revokeObjectURL(pdfBlobUrlAtual);
            }
            pdfBlobUrlAtual = URL.createObjectURL(blob);

            if (modalIframe) {
                modalIframe.src = pdfBlobUrlAtual;
            }
            if (modalPdf) {
                modalPdf.classList.add('open');
            }
        } catch (erro) {
            console.error('Erro na pré-visualização:', erro);
            alert('Não foi possível gerar a pré-visualização: ' + erro.message);
        }
    }

    // Ação: Imprimir PDF
    async function imprimirPdf() {
        const dados = coletarDadosFormulario();
        salvarDadosUsuario();
        exibirToast('Preparando documento para impressão...');

        try {
            const pdfBytes = await gerarPdfBytes(dados);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Criar iframe invisível para impressão limpa
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'fixed';
            printFrame.style.top = '-9999px';
            printFrame.style.left = '-9999px';
            printFrame.style.width = '1px';
            printFrame.style.height = '1px';
            printFrame.src = url;

            printFrame.onload = () => {
                setTimeout(() => {
                    try {
                        printFrame.contentWindow.focus();
                        printFrame.contentWindow.print();
                    } catch (e) {
                        // Se iframe print for bloqueado, abre em nova aba
                        window.open(url, '_blank');
                    }
                    setTimeout(() => {
                        document.body.removeChild(printFrame);
                        URL.revokeObjectURL(url);
                    }, 60000);
                }, 500);
            };

            document.body.appendChild(printFrame);
        } catch (erro) {
            console.error('Erro ao imprimir:', erro);
            alert('Erro ao preparar impressão: ' + erro.message);
        }
    }

    // Fechar Modal de Pré-visualização
    function fecharModal() {
        if (modalPdf) {
            modalPdf.classList.remove('open');
        }
        if (modalIframe) {
            modalIframe.src = 'about:blank';
        }
    }

    // Vincular Eventos Globais
    function iniciarEventos() {
        // Alteração do Mês
        if (elMesRef) {
            elMesRef.addEventListener('change', () => {
                mesAtualIndex = parseInt(elMesRef.value, 10);
                if (elMesEmissao) elMesEmissao.value = MESES[mesAtualIndex];
                renderizarTabelaDias();
            });
        }

        // Alteração do Ano
        if (elAnoRef) {
            elAnoRef.addEventListener('change', () => {
                anoAtual = parseInt(elAnoRef.value, 10) || 2026;
                inicializarSelects();
                renderizarTabelaDias();
            });
        }

        // Auto-salvar campos do formulário ao digitar
        [elNome, elMatricula, elLocalPadrao, elStdEntrada, elStdAlmocoInicio, elStdAlmocoFim, elStdSaida].forEach(el => {
            if (el) el.addEventListener('change', salvarDadosUsuario);
        });

        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => aplicarPreset(btn.dataset.preset));
        });

        // Botões de Automação
        const btnUteis = document.getElementById('btnPreencherUteis');
        if (btnUteis) btnUteis.addEventListener('click', preencherDiasUteis);

        const btnTodos = document.getElementById('btnPreencherTodos');
        if (btnTodos) btnTodos.addEventListener('click', preencherTodosOsDias);

        const btnLimparFds = document.getElementById('btnLimparFds');
        if (btnLimparFds) btnLimparFds.addEventListener('click', limparFinaisDeSemana);

        const btnLimparTudo = document.getElementById('btnLimparTudo');
        if (btnLimparTudo) btnLimparTudo.addEventListener('click', limparTodosOsDias);

        // Ações Principais
        const btnGerar = document.getElementById('btnGerarPdf');
        if (btnGerar) btnGerar.addEventListener('click', baixarPdfPreenchido);

        const btnPrever = document.getElementById('btnPreverPdf');
        if (btnPrever) btnPrever.addEventListener('click', previsualizarPdf);

        const btnImprimir = document.getElementById('btnImprimirPdf');
        if (btnImprimir) btnImprimir.addEventListener('click', imprimirPdf);

        // Modal
        if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
        if (modalPdf) {
            modalPdf.addEventListener('click', (e) => {
                if (e.target === modalPdf) fecharModal();
            });
        }
        if (btnDownloadModal) {
            btnDownloadModal.addEventListener('click', baixarPdfPreenchido);
        }
        if (btnImprimirModal) {
            btnImprimirModal.addEventListener('click', imprimirPdf);
        }

        // Tecla ESC para fechar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalPdf && modalPdf.classList.contains('open')) {
                fecharModal();
            }
        });
    }

    // Inicialização da Página
    document.addEventListener('DOMContentLoaded', () => {
        inicializarSelects();
        carregarDadosSalvos();
        renderizarTabelaDias();
        iniciarEventos();
    });

})();
