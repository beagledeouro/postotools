document.getElementById('btnGerar').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    statusDiv.innerText = "Procurando dados (vasculhando janelas)...";

    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
            statusDiv.innerText = "Erro: Abra a página do paciente no G-MUS.";
            return;
        }

        chrome.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true }, 
            function: extrairDadosGMUS,
        }, async (results) => {
            if (chrome.runtime.lastError) {
                statusDiv.innerText = "Erro: " + chrome.runtime.lastError.message;
                return;
            }
            
            let dadosCorretos = null;
            
            if (results && results.length > 0) {
                for (let frame of results) {
                    if (frame.result && frame.result.nome && frame.result.nome !== '') {
                        dadosCorretos = frame.result;
                        break; 
                    }
                }
            }

            if (dadosCorretos) {
                statusDiv.innerText = "Dados encontrados! Preenchendo PDF...";
                try {
                    await gerarPDF(dadosCorretos);
                    statusDiv.innerText = "Concluído com sucesso!";
                } catch (pdfError) {
                    statusDiv.innerText = "Erro na geração do PDF.";
                    console.error("Erro PDF:", pdfError);
                }
            } else {
                statusDiv.innerText = "Erro: Dados não encontrados. A ficha está aberta?";
            }
        });
    } catch (err) {
        statusDiv.innerText = "Erro Geral: " + err.message;
    }
});

// 1. EXTRAÇÃO DE DADOS 
function extrairDadosGMUS() {
    const extrairTexto = (seletor) => {
        const el = document.querySelector(seletor);
        if (!el) return '';
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value.trim();
        if (el.tagName === 'SELECT') return el.options[el.selectedIndex]?.text.trim() || el.value.trim();
        return el.innerText.trim();
    };

    const isMarcado = (seletor) => {
        const el = document.querySelector(seletor);
        return el ? el.checked : false;
    };

    const temMarcador = (palavra) => document.body.innerText.toUpperCase().includes(palavra.toUpperCase());

    const ddd = extrairTexto('#end_ddd_celular');
    const celular = extrairTexto('#end_nr_fone_celular');
    const telefoneFormatado = ddd ? `(${ddd}) ${celular}` : celular;

    return {
        nome: extrairTexto('#no_usuario'),
        codigo: extrairTexto('#id_usuario_gms'),
        cpf: extrairTexto('#cpf'),
        cns: extrairTexto('#nr_cns'),
        dataNasc: extrairTexto('#dt_nascimento'),
        sexo: extrairTexto('#id_sexo'), 
        estadoCivil: extrairTexto('#id_estado_civil') || extrairTexto('#estado_civil'), 
        mae: extrairTexto('#text_id_mae'),
        pai: extrairTexto('#text_id_pai'),
        natural: extrairTexto('#text_id_munlocnaturaliade'),
        telefone: telefoneFormatado,
        endereco: extrairTexto('#text_end_id_logradouro'),
        numero: extrairTexto('#end_nr_logradouro'),
        complemento: extrairTexto('#end_no_compl_logradouro'),
        bairro: extrairTexto('#text_end_id_bairro'),
        profissao: extrairTexto('#text_id_cbo'),
        area: extrairTexto("#text_dgu_micarea_id"), 
        cep: extrairTexto("#end_id_cep"),
        alergias: "", 

        tabagismo: isMarcado('#status_eh_fumante-1'),
        etilismo: isMarcado('#status_eh_dependente_alcool-1'),
        hipertenso: isMarcado('#status_tem_hipertensao_arterial-1'),
        avc: isMarcado('#status_teve_avc_derrame-1'),
        renal: isMarcado('#status_tem_teve_doencas_rins-1'),
        pele: isMarcado('#status_tem_hanseniase-1'), 
        tuberculose: isMarcado('#status_tem_tuberculose-1'),
        cancer: isMarcado('#status_tem_teve_cancer-1'),
        obeso: isMarcado('#situacao_peso-2'),
        mental: isMarcado('#status_tratamento_psiquico_ou_probema_mental-1'),
        droga: isMarcado('#status_eh_dependente_outras_drogas-1'), 
        outros: extrairTexto('#descricao_outra_condicao1').length > 0, 
        diabetico: isMarcado("#status_tem_diabetes-1"),
    };
}

// 2. PREENCHIMENTO DO PDF
async function gerarPDF(dados) {
    const url = chrome.runtime.getURL("Capa.pdf"); 
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
    
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    try {
        const preencherTexto = (campo, valor) => {
            if (valor) {
                try {
                    form.getTextField(campo).setText(valor);
                } catch (e) {
                    console.warn(`Aviso: não foi possível preencher texto em '${campo}'`, e);
                }
            }
        };

        const marcar = (campo, condicao) => {
            if (condicao) {
                try {
                    form.getCheckBox(campo).check();
                } catch (e) {
                    console.warn(`Aviso: não foi possível marcar checkbox '${campo}'`, e);
                }
            }
        };

        // Tratamento do campo Sexo (Radio Group)
        if (dados.sexo) {
            const sexoStr = dados.sexo.toUpperCase();
            try {
                // Assume que sexo_0z4m é o nome do RadioGroup inteiro
                const radioGroup = form.getRadioGroup('sexo_0z4m');
                if (sexoStr.startsWith('F')) radioGroup.select('fem_1h6i');
                else if (sexoStr.startsWith('M')) radioGroup.select('masc_9g3z');
            } catch (e) {
                // Fallback: se na verdade forem Checkboxes independentes
                if (sexoStr.startsWith('F')) marcar('fem_1h6i', true);
                else if (sexoStr.startsWith('M')) marcar('masc_9g3z', true);
            }
        }

        // Dados Pessoais
        preencherTexto('nome_3j3y', dados.nome);
        preencherTexto('cod_7n6g', dados.codigo);
        preencherTexto('endereco_9t9s', dados.endereco);
        preencherTexto('text_136_415_2k0w', dados.numero); 
        preencherTexto('complemento_0x0t', dados.complemento);
        preencherTexto('bairro_2c9x', dados.bairro);
        preencherTexto('profissao_4n5a', dados.profissao);
        preencherTexto('contato_3x9v', dados.telefone);
        preencherTexto('mae_8m8o', dados.mae);
        preencherTexto('pai_2g4t', dados.pai);
        preencherTexto('cartao_sus_0e9s', dados.cns);
        preencherTexto('cpf_8b7k', dados.cpf);
        preencherTexto('naturalidade_1o6y', dados.natural);
        preencherTexto('micro_area_6l0p', dados.area); 
        preencherTexto('cep_3j0e', dados.cep);
        preencherTexto('est_civil_8u5g', dados.estadoCivil);
        preencherTexto('alergico_5f5l', dados.alergias);

        // Tratamento da Data de Nascimento fragmentada
        if (dados.dataNasc) {
            const dataLimpa = dados.dataNasc.replace(/-/g, '/');
            const partes = dataLimpa.split('/');
            if (partes.length === 3) {
                let dia = partes[0], mes = partes[1], ano = partes[2];
                if (partes[0].length === 4) { 
                    ano = partes[0];
                    dia = partes[2];
                }
                preencherTexto('data_nasc_day_4i9b', dia);
                preencherTexto('data_nasc_month_2b0w', mes);
                preencherTexto('data_nasc_year_9p3w', ano);
            }
        }

        // Marcadores de Saúde 
        marcar('acamados_domiciliado_9e6j', dados.acamado);
        marcar('doenca_renal_3w2s', dados.renal); 
        marcar('doenca_renal_2v0x', dados.renal); 
        marcar('deficiencia_7z0e', dados.deficiencia);
        marcar('deficiencia_2n6d', dados.deficiencia); 
        marcar('hipertensao_4s5s', dados.hipertenso);
        marcar('saude_mental_4e2c', dados.mental);
        marcar('usuarios_de_drogas_6j5c', dados.droga);
        marcar('diabetes_4p5i', dados.diabetico);
        marcar('hanseniase_2v3r', dados.pele);
        marcar('obesidade_0j2n', dados.obeso);
        marcar('avc_7a3i', dados.avc);
        marcar('tuberculose_2v6z', dados.tuberculose);
        marcar('depressao_1i0s', dados.depressao);
        marcar('infarto_9d4p', dados.infarto);
        marcar('cancer_5n5n', dados.cancer);
        marcar('outros_5u2g', dados.outros);
        marcar('tabagismo_7p3v', dados.tabagismo);
        marcar('etilismo_4y7u', dados.etilismo);
        
        // Medicações em uso
        marcar('anti_hipertensivos_3z5m', dados.rPressao);
        marcar('anticoncepcionais_6n5g', dados.anticoncepcional);
        marcar('hipoglicemia_ante_oral_2x3e', dados.rGlicose);
        marcar('psicotropico_9l3m', dados.rMental);
        marcar('insulina_6k7l', dados.insulina);

    } catch (e) {
        console.warn("Erro ao processar PDF:", e);
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    chrome.downloads.download({
        url: blobUrl,
        filename: `Capa_${dados.nome || 'Paciente'}.pdf`
    });
}