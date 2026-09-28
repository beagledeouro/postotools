const canvas = document.getElementById('cartaoCanvas');
const ctx = canvas.getContext('2d');
const inputPaciente = document.getElementById('paciente');
const inputData = document.getElementById('data');
const inputHorario = document.getElementById('horario');
const inputEspecialidade = document.getElementById('especialidade');
const downloadBtn = document.getElementById('downloadBtn');

function formatarData(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function desenharCartao() {
    const paciente = inputPaciente.value || '[Nome do Paciente]';
    const data = formatarData(inputData.value) || '[Data]';
    const horario = inputHorario.value || '[Horário]';
    const especialidade = inputEspecialidade.value || '[Especialidade]';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#087e8b';
    ctx.fillRect(0, 0, canvas.width, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEMBRETE DE CONSULTA', canvas.width / 2, 40);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const margemX = 40;
    const linhas = [
        ['Paciente:', paciente], ['Data:', data], ['Horário:', horario], ['Especialidade:', especialidade]
    ];
    linhas.forEach(([titulo, valor], indice) => {
        const y = 108 + indice * 48;
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(titulo, margemX, y);
        ctx.fillStyle = '#0f172a';
        ctx.font = '24px "Segoe UI", Arial, sans-serif';
        ctx.fillText(valor, margemX + 160, y - 2, canvas.width - margemX - 180);
    });
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Por favor, chegue com 15 minutos de antecedência.', canvas.width / 2, 310);
}

function baixarImagem() {
    const nomeBase = inputPaciente.value.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const link = document.createElement('a');
    link.download = `consulta${nomeBase ? `-${nomeBase}` : ''}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

[inputPaciente, inputData, inputHorario, inputEspecialidade].forEach(input => input.addEventListener('input', desenharCartao));
downloadBtn.addEventListener('click', baixarImagem);
desenharCartao();
