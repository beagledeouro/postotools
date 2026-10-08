const canvas = document.getElementById('cartaoCanvas');
const ctx = canvas.getContext('2d');
const inputPaciente = document.getElementById('paciente');
const inputTelefone = document.getElementById('telefone');
const inputData = document.getElementById('data');
const inputHorario = document.getElementById('horario');
const inputEspecialidade = document.getElementById('especialidade');
const inputLocal = document.getElementById('localUnidade');

const chkAntecedencia = document.getElementById('chkAntecedencia');
const chkDocs = document.getElementById('chkDocs');
const chkExames = document.getElementById('chkExames');
const chkJejum = document.getElementById('chkJejum');
const chkAviso = document.getElementById('chkAviso');

const btnWhatsapp = document.getElementById('btnWhatsapp');
const btnCopiar = document.getElementById('btnCopiar');
const btnDownload = document.getElementById('btnDownload');
const msgPreviewEl = document.getElementById('msgPreviewText');
const feedbackToast = document.getElementById('feedbackToast');

const logoInstitucional = new Image();
logoInstitucional.src = '../assets/logo.png';

function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function aplicarMascaraTelefone(valor) {
    let limpo = valor.replace(/\D/g, '').slice(0, 11);
    if (limpo.length > 10) {
        return limpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (limpo.length > 6) {
        return limpo.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (limpo.length > 2) {
        return limpo.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    return limpo;
}

function obterTextoMensagem() {
    const paciente = inputPaciente.value.trim() || '[Nome do Paciente]';
    const data = formatarData(inputData.value) || '[Data]';
    const horario = inputHorario.value || '[Horário]';
    const especialidade = inputEspecialidade.value.trim() || '[Especialidade / Consulta]';
    const unidade = inputLocal.value.trim() || 'ESF CDI 2';

    let instrucoes = [];
    if (chkAntecedencia.checked) instrucoes.push('⏰ Chegue com 15 minutos de antecedência.');
    if (chkDocs.checked) instrucoes.push('🪪 Traga documento oficial com foto e Cartão SUS.');
    if (chkExames.checked) instrucoes.push('📑 Traga receitas em uso e exames anteriores.');
    if (chkJejum.checked) instrucoes.push('💧 Atenção: comparecer em jejum de 8 a 12 horas.');
    if (chkAviso.checked) instrucoes.push('⚠️ Se não puder comparecer, avise com antecedência para liberar a vaga a outro paciente.');

    let texto = `*LEMBRETE DE AGENDAMENTO — ${unidade.toUpperCase()}*\n\n` +
        `Olá, *${paciente}*!\n` +
        `Confirmamos seu agendamento de saúde:\n\n` +
        `📍 *Local:* ${unidade}\n` +
        `📅 *Data:* ${data}\n` +
        `⏰ *Horário:* ${horario}\n` +
        `🩺 *Atendimento:* ${especialidade}\n`;

    if (instrucoes.length > 0) {
        texto += `\n*Recomendações importantes:*\n` + instrucoes.join('\n') + `\n`;
    }

    texto += `\n_Em caso de dúvidas, procure a recepção da unidade._`;
    return texto;
}

function atualizarPreviaTexto() {
    const texto = obterTextoMensagem();
    if (msgPreviewEl) msgPreviewEl.textContent = texto;
}

function desenharCartao() {
    const paciente = inputPaciente.value || '[Nome do Paciente]';
    const data = formatarData(inputData.value) || '[Data]';
    const horario = inputHorario.value || '[Horário]';
    const especialidade = inputEspecialidade.value || '[Especialidade]';
    const unidade = inputLocal.value || 'ESF CDI 2';

    // Fundo geral
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Faixa Superior
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, 76);
    if (logoInstitucional.complete && logoInstitucional.naturalWidth > 0) {
        ctx.drawImage(logoInstitucional, 24, 10, 238, 56);
    }
    ctx.fillStyle = '#087e8b';
    ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(unidade, canvas.width - 24, 38);

    // Barra de Título
    ctx.fillStyle = '#087e8b';
    ctx.fillRect(0, 76, canvas.width, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEMBRETE DE CONSULTA', canvas.width / 2, 110);

    // Informações Principais
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const margemX = 40;
    const linhas = [
        ['Paciente:', paciente],
        ['Data:', data],
        ['Horário:', horario],
        ['Atendimento:', especialidade]
    ];

    linhas.forEach(([titulo, valor], indice) => {
        const y = 165 + indice * 36;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
        ctx.fillText(titulo, margemX, y);
        ctx.fillStyle = '#0f172a';
        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(valor, margemX + 150, y - 1, canvas.width - margemX - 170);
    });

    // Rodapé de aviso
    let textoRodape = 'Por favor, chegue com 15 minutos de antecedência com Cartão SUS e Doc. com Foto.';
    if (chkJejum.checked) {
        textoRodape = 'Atenção: Necessário JEJUM de 8 a 12 horas. Trazer Cartão SUS e Documento.';
    }
    ctx.fillStyle = '#087e8b';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(textoRodape, canvas.width / 2, 318);
}

function exibirAviso(mensagem) {
    if (!feedbackToast) return;
    feedbackToast.textContent = mensagem;
    feedbackToast.className = 'feedback-toast show success';
    setTimeout(() => {
        feedbackToast.className = 'feedback-toast';
    }, 4000);
}

function abrirWhatsApp() {
    const telefoneLimpo = (inputTelefone.value || '').replace(/\D/g, '');
    const texto = encodeURIComponent(obterTextoMensagem());
    let url = '';
    if (telefoneLimpo.length >= 10) {
        url = `https://wa.me/55${telefoneLimpo}?text=${texto}`;
    } else {
        url = `https://wa.me/?text=${texto}`;
    }
    window.open(url, '_blank');
}

async function copiarTexto() {
    const texto = obterTextoMensagem();
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(texto);
        } else {
            const temp = document.createElement('textarea');
            temp.value = texto;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
        }
        exibirAviso('Mensagem copiada para a área de transferência com sucesso!');
    } catch (err) {
        console.error('Erro ao copiar:', err);
        alert('Não foi possível copiar automaticamente. Selecione e copie o texto da prévia.');
    }
}

function baixarImagem() {
    const nomeBase = inputPaciente.value.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const link = document.createElement('a');
    link.download = `${nomeBase || 'paciente'}_consulta.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function carregarParametrosURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('paciente')) inputPaciente.value = params.get('paciente');
    if (params.has('telefone')) inputTelefone.value = aplicarMascaraTelefone(params.get('telefone'));
    if (params.has('especialidade')) inputEspecialidade.value = params.get('especialidade');
    if (params.has('data')) inputData.value = params.get('data');
    if (params.has('horario')) inputHorario.value = params.get('horario');
}

document.addEventListener('DOMContentLoaded', () => {
    // Definir data padrão para hoje
    const hoje = new Date();
    const dataLocal = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    inputData.value = dataLocal;

    carregarParametrosURL();

    inputTelefone.addEventListener('input', (e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
        atualizarPreviaTexto();
    });

    [inputPaciente, inputData, inputHorario, inputEspecialidade, inputLocal].forEach(input => {
        input.addEventListener('input', () => {
            desenharCartao();
            atualizarPreviaTexto();
        });
    });

    [chkAntecedencia, chkDocs, chkExames, chkJejum, chkAviso].forEach(chk => {
        chk.addEventListener('change', () => {
            desenharCartao();
            atualizarPreviaTexto();
        });
    });

    btnWhatsapp.addEventListener('click', abrirWhatsApp);
    btnCopiar.addEventListener('click', copiarTexto);
    btnDownload.addEventListener('click', baixarImagem);
    logoInstitucional.addEventListener('load', desenharCartao);

    desenharCartao();
    atualizarPreviaTexto();
});
