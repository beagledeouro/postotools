// Gerenciamento de Abas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.calc-card').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.getElementById(tabId).classList.add('active');
    });
});

// 1. CALCULADORA OBSTÉTRICA (DUM / DPP / IG)
function calcularObstetrica() {
    const dumStr = document.getElementById('dumInput').value;
    if (!dumStr) {
        alert('Por favor, informe a Data da Última Menstruação (DUM).');
        return;
    }

    const [ano, mes, dia] = dumStr.split('-').map(Number);
    const dataDUM = new Date(ano, mes - 1, dia);
    const dataRef = document.getElementById('dataRefObstetrica').value
        ? new Date(...document.getElementById('dataRefObstetrica').value.split('-').map((v, i) => i === 1 ? v - 1 : +v))
        : new Date();

    if (dataDUM > dataRef) {
        alert('A DUM não pode ser posterior à data de referência/hoje.');
        return;
    }

    // Regra de Naegele: DUM + 7 dias, mês + 9 (ou mês - 3), ano + 1 se necessário
    const dpp = new Date(dataDUM.getFullYear(), dataDUM.getMonth(), dataDUM.getDate() + 7);
    dpp.setMonth(dpp.getMonth() + 9);

    // Cálculo da Idade Gestacional (em dias corridos)
    const diffMs = dataRef.getTime() - dataDUM.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(diffDias / 7);
    const diasRestantes = diffDias % 7;

    // Determinação do Trimestre
    let trimestre = '1º Trimestre (0 a 13 semanas)';
    if (semanas >= 28) {
        trimestre = '3º Trimestre (28 a 40+ semanas)';
    } else if (semanas >= 14) {
        trimestre = '2º Trimestre (14 a 27 semanas)';
    }

    const formatar = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    document.getElementById('igResultado').textContent = `${semanas} semanas e ${diasRestantes} dias`;
    document.getElementById('dppResultado').textContent = formatar(dpp);
    document.getElementById('trimestreResultado').textContent = trimestre;
    document.getElementById('diasResultado').textContent = `${diffDias} dias decorridos`;

    let infoExames = '';
    if (semanas < 14) {
        infoExames = '📌 <strong>Conduta recomendada no 1º Trimestre:</strong> Tipagem sanguínea + Rh, Hemograma, Glicemia de jejum, VDRL/Sífilis, HIV, Hepatite B (HBsAg), Toxoplasmose (IgM/IgG), Urina rotina + Urocultura, Ultrassom de 1º trimestre (11 a 14 semanas). Prescrever Ácido Fólico.';
    } else if (semanas < 28) {
        infoExames = '📌 <strong>Conduta recomendada no 2º Trimestre:</strong> Ultrassom Morfológico (20 a 24 semanas), Teste de Tolerância Oral à Glicose (TOTG 75g entre 24 e 28 semanas), Suplementação de Sulfato Ferroso (a partir da 20ª sem). Vacinação dTpa a partir da 20ª semana.';
    } else {
        infoExames = '📌 <strong>Conduta recomendada no 3º Trimestre:</strong> Repetir Hemograma, Glicemia, VDRL, HIV, Hepatite B, Toxoplasmose. Rastreio de Streptococcus do Grupo B (35 a 37 semanas). Avaliar apresentação fetal e plano de parto.';
    }

    const interpEl = document.getElementById('interpObstetrica');
    interpEl.innerHTML = infoExames;
    interpEl.className = 'result-interpretation badge-normal';

    document.getElementById('resObstetrica').classList.add('show');
}

// 2. CALCULADORA DE IMC (ADULTO E IDOSO)
function calcularIMC() {
    const peso = parseFloat(document.getElementById('pesoInput').value);
    const alturaCm = parseFloat(document.getElementById('alturaInput').value);
    const idade = parseInt(document.getElementById('idadeInput').value, 10) || 30;
    const ehIdoso = idade >= 60 || document.getElementById('chkIdoso').checked;

    if (!peso || !alturaCm || peso <= 0 || alturaCm <= 0) {
        alert('Informe peso e altura válidos.');
        return;
    }

    const alturaM = alturaCm > 3 ? alturaCm / 100 : alturaCm;
    const imc = peso / (alturaM * alturaM);

    let classificacao = '';
    let badgeClass = 'badge-normal';
    let faixaIdeal = '';

    if (ehIdoso) {
        // Critério de Lipschitz para Idosos (≥ 60 anos)
        faixaIdeal = `${(22 * alturaM * alturaM).toFixed(1)} kg a ${(27 * alturaM * alturaM).toFixed(1)} kg (IMC 22 - 27)`;
        if (imc < 22) {
            classificacao = 'Baixo Peso / Desnutrição (Critério de Lipschitz)';
            badgeClass = 'badge-perigo';
        } else if (imc <= 27) {
            classificacao = 'Eutrofia / Peso Adequado para Idoso';
            badgeClass = 'badge-normal';
        } else {
            classificacao = 'Sobrepeso / Obesidade para Idoso';
            badgeClass = 'badge-alerta';
        }
    } else {
        // Critério OMS para Adultos
        faixaIdeal = `${(18.5 * alturaM * alturaM).toFixed(1)} kg a ${(24.9 * alturaM * alturaM).toFixed(1)} kg (IMC 18.5 - 24.9)`;
        if (imc < 18.5) {
            classificacao = 'Abaixo do Peso';
            badgeClass = 'badge-alerta';
        } else if (imc < 25) {
            classificacao = 'Eutrofia (Peso Normal)';
            badgeClass = 'badge-normal';
        } else if (imc < 30) {
            classificacao = 'Sobrepeso (Pré-obesidade)';
            badgeClass = 'badge-alerta';
        } else if (imc < 35) {
            classificacao = 'Obesidade Grau I';
            badgeClass = 'badge-perigo';
        } else if (imc < 40) {
            classificacao = 'Obesidade Grau II';
            badgeClass = 'badge-perigo';
        } else {
            classificacao = 'Obesidade Grau III (Mórbida)';
            badgeClass = 'badge-perigo';
        }
    }

    document.getElementById('imcResultado').textContent = imc.toFixed(2) + ' kg/m²';
    document.getElementById('classifResultado').textContent = classificacao;
    document.getElementById('pesoIdealResultado').textContent = faixaIdeal;

    const interpEl = document.getElementById('interpIMC');
    interpEl.className = `result-interpretation ${badgeClass}`;
    interpEl.innerHTML = `<strong>Avaliação:</strong> Paciente classificado como <strong>${classificacao}</strong>. Avaliar hábitos alimentares, atividade física e fatores de risco associados (PA, Glicemia, Perfil Lipídico).`;

    document.getElementById('resIMC').classList.add('show');
}

// 3. CLEARANCE DE CREATININA (COCKCROFT-GAULT)
function calcularClearance() {
    const idade = parseFloat(document.getElementById('crIdade').value);
    const peso = parseFloat(document.getElementById('crPeso').value);
    const creatinina = parseFloat(document.getElementById('crSérica').value);
    const sexo = document.getElementById('crSexo').value;

    if (!idade || !peso || !creatinina || idade <= 0 || peso <= 0 || creatinina <= 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    // Fórmula: [(140 - idade) * peso] / (72 * CrSérica) * (0.85 se mulher)
    let clcr = ((140 - idade) * peso) / (72 * creatinina);
    if (sexo === 'F') {
        clcr *= 0.85;
    }

    let estagioDRC = '';
    let badgeClass = 'badge-normal';
    let orientacao = '';

    if (clcr >= 90) {
        estagioDRC = 'Estágio 1 (Função renal normal / discretamente alterada)';
        orientacao = 'Função renal preservada. Manter controle de fatores de risco (DM/HAS).';
    } else if (clcr >= 60) {
        estagioDRC = 'Estágio 2 (Perda leve da função renal)';
        badgeClass = 'badge-alerta';
        orientacao = 'Atenção ao uso de anti-inflamatórios (AINEs). Monitorar anualmente Cr e proteinúria.';
    } else if (clcr >= 30) {
        estagioDRC = 'Estágio 3 (Perda moderada da função renal)';
        badgeClass = 'badge-perigo';
        orientacao = 'Ajustar doses de medicamentos de excreção renal (Metformina, antibióticos, atenolol). Evitar AINEs. Encaminhar para Nefrologia se proteinúria elevada.';
    } else if (clcr >= 15) {
        estagioDRC = 'Estágio 4 (Perda severa da função renal)';
        badgeClass = 'badge-perigo';
        orientacao = 'Acompanhamento nefrológico obrigatório. Ajuste rigoroso de fármacos. Suspender metformina se ClCr < 30.';
    } else {
        estagioDRC = 'Estágio 5 (Falência renal / Pré-diálise)';
        badgeClass = 'badge-perigo';
        orientacao = 'Encaminhamento urgente ao nefrologista para planejamento de terapia renal substitutiva (diálise/transplante).';
    }

    document.getElementById('clcrResultado').textContent = `${clcr.toFixed(1)} mL/min`;
    document.getElementById('estagioResultado').textContent = estagioDRC;

    const interpEl = document.getElementById('interpClearance');
    interpEl.className = `result-interpretation ${badgeClass}`;
    interpEl.innerHTML = `<strong>Classificação:</strong> ${estagioDRC}.<br><strong>Conduta:</strong> ${orientacao}`;

    document.getElementById('resClearance').classList.add('show');
}

// 4. RISCO CARDIOVASCULAR SIMPLIFICADO
function calcularRiscoCV() {
    const idade = parseInt(document.getElementById('cvIdade').value, 10) || 45;
    const pas = parseInt(document.getElementById('cvPas').value, 10) || 120;
    const fuma = document.getElementById('cvFuma').value === 'sim';
    const dm = document.getElementById('cvDm').value === 'sim';
    const colesterolAlto = document.getElementById('cvColesterol').value === 'sim';

    let pontos = 0;
    if (idade >= 65) pontos += 3;
    else if (idade >= 55) pontos += 2;
    else if (idade >= 45) pontos += 1;

    if (pas >= 160) pontos += 3;
    else if (pas >= 140) pontos += 2;
    else if (pas >= 130) pontos += 1;

    if (fuma) pontos += 2;
    if (dm) pontos += 3; // Diabetes confere alto risco cardiovascular na APS
    if (colesterolAlto) pontos += 2;

    let risco = 'Baixo Risco Cardiovascular (< 5% em 10 anos)';
    let badgeClass = 'badge-normal';
    let conduta = 'Reforçar mudanças de estilo de vida (alimentação saudável, atividade física regular). Reavaliação anual.';

    if (pontos >= 6 || dm) {
        risco = 'Alto Risco Cardiovascular (> 20% em 10 anos)';
        badgeClass = 'badge-perigo';
        conduta = 'Metas estritas de PA (< 130/80 mmHg), LDL (< 70 mg/dL). Indicação formal de Estatina de moderada a alta potência. Considerar AAS em prevenção secundária. Cessação imediata do tabagismo.';
    } else if (pontos >= 3) {
        risco = 'Risco Intermediário / Moderado (5% a 20% em 10 anos)';
        badgeClass = 'badge-alerta';
        conduta = 'Mudança de estilo de vida intensiva por 3 a 6 meses. Se metas não forem atingidas, considerar iniciar Estatina e terapia anti-hipertensiva. Reavaliação a cada 6 meses.';
    }

    document.getElementById('cvRiscoResultado').textContent = risco;
    const interpEl = document.getElementById('interpCV');
    interpEl.className = `result-interpretation ${badgeClass}`;
    interpEl.innerHTML = `<strong>Escore Estimado:</strong> ${pontos} pontos.<br><strong>Recomendação Clínica:</strong> ${conduta}`;

    document.getElementById('resCV').classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
    // Definir data padrão de referência para a gestante como hoje
    const hoje = new Date();
    const dataLocal = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const dataRefEl = document.getElementById('dataRefObstetrica');
    if (dataRefEl) dataRefEl.value = dataLocal;

    document.getElementById('btnCalcObstetrica').addEventListener('click', calcularObstetrica);
    document.getElementById('btnCalcIMC').addEventListener('click', calcularIMC);
    document.getElementById('btnCalcClearance').addEventListener('click', calcularClearance);
    document.getElementById('btnCalcCV').addEventListener('click', calcularRiscoCV);
});
