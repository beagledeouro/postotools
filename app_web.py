"""
G-MUS Web Dashboard & Automação Nuvem (Google Drive)
Aplicação Web completa para Navegador com Autenticação Direta no G-MUS.
"""

import os
import re
import sys
import json
import time
import threading
import requests
import pandas as pd
from datetime import datetime
from flask import Flask, render_template_string, request, redirect, url_for, session, jsonify, send_file, flash
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup

import app_cli
import analisador_gmus
import gdrive_sync

DIRETORIO_ATUAL = os.path.dirname(os.path.abspath(__file__))
PASTA_PLANILHAS = os.path.join(DIRETORIO_ATUAL, "planilhas_geradas")
os.makedirs(PASTA_PLANILHAS, exist_ok=True)

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Estado das extrações em segundo plano por usuário
tarefas_extracao = {}


def obter_caminho_planilha_usuario(usuario: str, microarea: str) -> str:
    limpo = re.sub(r"\W+", "_", str(usuario)).strip("_")
    return os.path.join(PASTA_PLANILHAS, f"Relatorio_Microarea_{microarea}_{limpo}.xlsx")


def login_obrigatorio(f):
    from functools import wraps
    @wraps(f)
    def decorada(*args, **kwargs):
        if "usuario" not in session:
            return redirect(url_for("rota_login"))
        return f(*args, **kwargs)
    return decorada


# ==============================================================================
# TEMPLATES HTML EMBUTIDOS (RESPONSIVO COM BOOTSTRAP 5 E TEMA SUS / SAÚDE)
# ==============================================================================

HTML_LOGIN = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acesso Seguro | G-MUS Saúde Digital</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .card-login {
            background: rgba(255, 255, 255, 0.98);
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 440px;
            padding: 2.5rem;
        }
        .btn-saude {
            background-color: #0284c7;
            color: #fff;
            font-weight: 600;
        }
        .btn-saude:hover {
            background-color: #0369a1;
            color: #fff;
        }
    </style>
</head>
<body>
    <div class="card-login">
        <div class="text-center mb-4">
            <div class="d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle mb-3" style="width: 64px; height: 64px;">
                <i class="bi bi-hospital fs-2"></i>
            </div>
            <h3 class="fw-bold text-dark">G-MUS Saúde</h3>
            <p class="text-muted small">Autenticação Integrada para ACS e Equipe de Saúde</p>
        </div>

        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ category }} py-2 small" role="alert">
                        <i class="bi bi-exclamation-triangle me-1"></i> {{ message }}
                    </div>
                {% endfor %}
            {% endif %}
        {% endwith %}

        <form method="POST" action="{{ url_for('rota_login') }}">
            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary">Usuário do G-MUS</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-person"></i></span>
                    <input type="text" name="usuario" class="form-control" placeholder="Seu usuário G-MUS" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label small fw-bold text-secondary">Senha de Acesso</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-lock"></i></span>
                    <input type="password" name="senha" class="form-control" placeholder="Sua senha G-MUS" required>
                </div>
                <div class="form-text small text-muted">
                    <i class="bi bi-shield-check text-success"></i> Acesso protegido pelas credenciais oficiais do G-MUS.
                </div>
            </div>

            <button type="submit" class="btn btn-saude w-100 py-2 mb-3">
                <i class="bi bi-box-arrow-in-right me-1"></i> Entrar no Sistema
            </button>
        </form>

        <div class="text-center border-top pt-3 text-muted" style="font-size: 0.8rem;">
            Atenção: Os dados são confidenciais e protegidos pela LGPD.
        </div>
    </div>
</body>
</html>
"""

HTML_DASHBOARD = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel da Microárea | G-MUS Web</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body { background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
        .navbar-custom { background-color: #1e3a8a; }
        .card-stat { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .progress { height: 18px; border-radius: 9px; }
    </style>
</head>
<body>
    <!-- Barra Superior -->
    <nav class="navbar navbar-custom navbar-dark px-4 py-2">
        <a class="navbar-brand fw-bold d-flex align-items-center" href="/">
            <i class="bi bi-clipboard2-pulse me-2 fs-4 text-info"></i>
            G-MUS Microáreas & Google Drive
        </a>
        <div class="d-flex align-items-center text-white small">
            <span class="me-3 d-none d-md-inline"><i class="bi bi-person-circle me-1"></i> {{ session.get('usuario') }}</span>
            <a href="{{ url_for('rota_logout') }}" class="btn btn-outline-light btn-sm">
                <i class="bi bi-box-arrow-right"></i> Sair
            </a>
        </div>
    </nav>

    <div class="container py-4">
        <!-- Status do Google Drive -->
        <div class="alert {% if gdrive_status.configurado %}alert-success{% else %}alert-warning{% endif %} d-flex align-items-center justify-content-between mb-4 shadow-sm" role="alert">
            <div class="d-flex align-items-center">
                <i class="bi {% if gdrive_status.configurado %}bi-cloud-check-fill text-success fs-3{% else %}bi-cloud-slash text-warning fs-3{% endif %} me-3"></i>
                <div>
                    <h6 class="mb-0 fw-bold">Sincronização Nuvem: Google Drive</h6>
                    <small>{{ gdrive_status.detalhe }}</small>
                </div>
            </div>
            <button class="btn btn-sm btn-outline-dark" data-bs-toggle="modal" data-bs-target="#modalGoogleDrive">
                <i class="bi bi-gear me-1"></i> Como Vincular ao E-mail do Posto
            </button>
        </div>

        <div class="row g-4">
            <!-- Coluna Esquerda: Ações de Extração -->
            <div class="col-lg-5">
                <div class="card card-stat p-4">
                    <h5 class="fw-bold text-dark mb-3">
                        <i class="bi bi-lightning-charge text-warning me-2"></i>Extrair & Atualizar Planilha
                    </h5>
                    <p class="text-muted small">
                        Realiza o mapeamento completo da microárea e salva sua <strong>planilha única individual</strong> diretamente na pasta do Google Drive.
                    </p>

                    <div class="mb-3">
                        <label class="form-label small fw-bold">Código da Microárea:</label>
                        <input type="text" id="campoMicroarea" class="form-control" value="4" placeholder="Ex: 4 ou 04">
                    </div>

                    <div class="mb-3">
                        <label class="form-label small fw-bold">Velocidade (Conexões Paralelas):</label>
                        <select id="campoThreads" class="form-select">
                            <option value="5" selected>5 conexões simultâneas (Recomendado)</option>
                            <option value="8">8 conexões (Mais rápido)</option>
                            <option value="3">3 conexões (Redes lentas)</option>
                        </select>
                    </div>

                    <button id="btnIniciarExtracao" class="btn btn-primary w-100 py-2 fw-bold" onclick="iniciarExtracao()">
                        <i class="bi bi-cloud-arrow-up me-2"></i>Extrair Tudo & Salvar no Drive
                    </button>

                    <!-- Progresso em Tempo Real -->
                    <div id="blocoProgresso" class="mt-4" style="display: none;">
                        <div class="d-flex justify-content-between small fw-bold mb-1">
                            <span id="textoStatus">Iniciando...</span>
                            <span id="textoPorcentagem">0%</span>
                        </div>
                        <div class="progress mb-2">
                            <div id="barraProgresso" class="progress-bar progress-bar-striped progress-bar-animated bg-success" style="width: 0%"></div>
                        </div>
                        <div id="caixaLogs" class="bg-dark text-light p-2 rounded small font-monospace" style="height: 120px; overflow-y: auto; font-size: 0.75rem;"></div>
                    </div>
                </div>

                <!-- Card de Acesso Rápido aos Arquivos do Usuário -->
                <div class="card card-stat p-4 mt-4">
                    <h6 class="fw-bold text-dark mb-3">
                        <i class="bi bi-file-earmark-excel text-success me-2"></i>Sua Planilha Atual
                    </h6>
                    <div id="detalhesPlanilha">
                        <p class="text-muted small mb-3">
                            Arquivo pessoal: <code>Relatorio_Microarea_4_{{ session.get('usuario') }}.xlsx</code>
                        </p>
                        <div class="d-grid gap-2">
                            <a id="btnDownloadLocal" href="{{ url_for('rota_download') }}" class="btn btn-outline-success">
                                <i class="bi bi-download me-1"></i> Baixar Planilha (.xlsx)
                            </a>
                            <a id="btnAbrirGoogleDrive" href="#" target="_blank" class="btn btn-outline-primary" style="display: none;">
                                <i class="bi bi-google me-1"></i> Abrir no Google Drive da Unidade
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Coluna Direita: Consulta Rápida de Moradores e Auditoria -->
            <div class="col-lg-7">
                <div class="card card-stat p-4">
                    <h5 class="fw-bold text-dark mb-3">
                        <i class="bi bi-search text-primary me-2"></i>Consulta Rápida de Moradores
                    </h5>
                    <p class="text-muted small">
                        Pesquise pacientes offline diretamente pelo Nome, CPF, Domicílio ou Logradouro.
                    </p>

                    <div class="input-group mb-3">
                        <input type="text" id="campoBusca" class="form-control" placeholder="Digite nome, CPF ou número da casa..." onkeypress="if(event.key==='Enter') buscarMoradores()">
                        <button class="btn btn-secondary" onclick="buscarMoradores()">
                            <i class="bi bi-search"></i> Buscar
                        </button>
                    </div>

                    <div id="resultadoBusca" style="max-height: 480px; overflow-y: auto;">
                        <div class="text-center text-muted py-4">
                            <i class="bi bi-people fs-1 text-secondary opacity-50"></i>
                            <p class="mt-2 small">Digite um termo acima para visualizar os dados clínicos e pendências de CPF.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Informativo: Como Vincular ao E-mail do Posto -->
    <div class="modal fade" id="modalGoogleDrive" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title"><i class="bi bi-google me-2"></i>Como Vincular ao E-mail Google do Posto</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4">
                    <p>Para o sistema enviar as planilhas automaticamente para o Google Drive do posto sem precisar pedir senha toda vez, siga este passo a passo simples:</p>
                    <ol class="small lh-lg">
                        <li>Acesse o <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com/" target="_blank">console.cloud.google.com</a>) com a conta do posto.</li>
                        <li>Crie um projeto gratuito chamado <strong>"GMUS-Drive"</strong> e ative a <strong>Google Drive API</strong>.</li>
                        <li>Em <em>Credenciais</em>, clique em <strong>Criar Credenciais ➔ Conta de Serviço (Service Account)</strong>.</li>
                        <li>Baixe o arquivo de chaves em formato JSON e salve-o nesta pasta com o nome exato: <br><code>/workspace/posto/gdrive_service_account.json</code></li>
                        <li><strong>O PULO DO GATO:</strong> No Google Drive do posto, crie uma pasta chamada <strong>"G-MUS_Microareas"</strong> e clique em <em>Compartilhar</em> com o e-mail da conta de serviço que você gerou!</li>
                    </ol>
                    <div class="alert alert-info small mb-0">
                        <i class="bi bi-info-circle me-1"></i> Enquanto o arquivo JSON não for colocado, o sistema salva automaticamente em uma pasta de backup local <code>/planilhas_drive_local</code>, permitindo que você baixe os arquivos normalmente pelo navegador.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let intervaloStatus = null;

        function iniciarExtracao() {
            const microarea = document.getElementById("campoMicroarea").value.trim() || "4";
            const threads = document.getElementById("campoThreads").value;

            document.getElementById("btnIniciarExtracao").disabled = true;
            document.getElementById("blocoProgresso").style.display = "block";
            document.getElementById("caixaLogs").innerHTML = "";

            fetch("/api/iniciar_extracao", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({microarea: microarea, threads: threads})
            })
            .then(res => res.json())
            .then(data => {
                intervaloStatus = setInterval(monitorarProgresso, 1500);
            })
            .catch(err => {
                alert("Erro ao disparar extração: " + err);
                document.getElementById("btnIniciarExtracao").disabled = false;
            });
        }

        function monitorarProgresso() {
            fetch("/api/status_extracao")
            .then(res => res.json())
            .then(data => {
                document.getElementById("textoStatus").innerText = data.mensagem || "Processando...";
                document.getElementById("textoPorcentagem").innerText = data.progresso + "%";
                document.getElementById("barraProgresso").style.width = data.progresso + "%";

                if (data.logs && data.logs.length) {
                    const logBox = document.getElementById("caixaLogs");
                    logBox.innerHTML = data.logs.join("<br>");
                    logBox.scrollTop = logBox.scrollHeight;
                }

                if (data.concluido) {
                    clearInterval(intervaloStatus);
                    document.getElementById("btnIniciarExtracao").disabled = false;
                    document.getElementById("barraProgresso").classList.remove("progress-bar-animated");

                    if (data.web_link) {
                        const btnDrive = document.getElementById("btnAbrirGoogleDrive");
                        btnDrive.href = data.web_link;
                        btnDrive.style.display = "block";
                    }

                    alert("✅ Extração concluída com sucesso! Planilha gerada e sincronizada.");
                } else if (data.erro) {
                    clearInterval(intervaloStatus);
                    document.getElementById("btnIniciarExtracao").disabled = false;
                    alert("Erro durante a extração: " + data.erro);
                }
            });
        }

        function buscarMoradores() {
            const termo = document.getElementById("campoBusca").value.trim();
            if (!termo) return;

            const resDiv = document.getElementById("resultadoBusca");
            resDiv.innerHTML = '<div class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Buscando na base de moradores...</div>';

            fetch(`/api/buscar?termo=${encodeURIComponent(termo)}`)
            .then(res => res.json())
            .then(data => {
                if (!data.resultados || !data.resultados.length) {
                    resDiv.innerHTML = '<div class="alert alert-warning small">Nenhum morador encontrado com esse critério.</div>';
                    return;
                }

                let html = '';
                data.resultados.forEach(p => {
                    const statusClass = p.Status_Cadastro === 'Regular' ? 'badge bg-success' : 'badge bg-warning text-dark';
                    html += `
                        <div class="card p-3 mb-2 shadow-sm border-0 border-start border-4 border-primary">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="mb-0 fw-bold text-dark">${p.Nome}</h6>
                                <span class="${statusClass}">${p.Status_Cadastro}</span>
                            </div>
                            <div class="small text-muted mb-2">
                                <strong>Idade:</strong> ${p.Idade || 'N/D'} anos (${p.Sexo}) | 
                                <strong>CPF:</strong> ${p.CPF_Formatado || 'NÃO INFORMADO'} | 
                                <strong>Celular:</strong> ${p.Telefone_Formatado || 'Sem telefone'}
                            </div>
                            <div class="small text-secondary">
                                📍 <strong>Endereço:</strong> ${p.Rua}, Nº ${p.Numero} (Dom. ${p.Domicílio_ID})<br>
                                🩺 <strong>Risco Clínico:</strong> <span class="fw-bold text-danger">${p.Nivel_Risco}</span> (${p.Detalhe_Risco})
                            </div>
                        </div>
                    `;
                });
                resDiv.innerHTML = html;
            });
        }
    </script>
</body>
</html>
"""

# ==============================================================================
# ROTAS DA APLICAÇÃO WEB
# ==============================================================================

@app.route("/login", methods=["GET", "POST"])
def rota_login():
    if request.method == "POST":
        usuario = request.form.get("usuario", "").strip()
        senha = request.form.get("senha", "").strip()

        if not usuario or not senha:
            flash("Informe o usuário e a senha do G-MUS.", "warning")
            return render_template_string(HTML_LOGIN)

        # Autenticação direta e segura no G-MUS
        sessao_http = app_cli.criar_sessao_http()
        sucesso = False

        try:
            res_page = sessao_http.get(app_cli.URL_LOGIN_PAGE, timeout=12)
            soup = BeautifulSoup(res_page.text, "html.parser")
            campo_user = "usuario"
            campo_pass = "senha"

            inp_user = soup.find("input", {"data-user": "user"})
            if inp_user and inp_user.get("name"):
                campo_user = inp_user["name"]

            inp_pass = soup.find("input", {"data-pass": "pass"})
            if inp_pass and inp_pass.get("name"):
                campo_pass = inp_pass["name"]

            payload = {
                campo_user: usuario,
                campo_pass: senha,
                "usuario": usuario,
                "senha": senha
            }

            headers_login = {
                "Referer": app_cli.URL_LOGIN_PAGE,
                "Origin": app_cli.BASE_URL,
                "X-Requested-With": "XMLHttpRequest"
            }

            resp = sessao_http.post(app_cli.URL_LOGIN_ACTION, data=payload, headers=headers_login, timeout=15)
            try:
                dados_resp = resp.json()
                if dados_resp.get("success"):
                    sucesso = True
            except Exception:
                if '"success":true' in resp.text.lower() or (resp.status_code == 302 and "login" not in resp.headers.get("Location", "")):
                    sucesso = True

        except Exception as e:
            flash(f"Erro ao conectar ao servidor do G-MUS: {e}", "danger")
            return render_template_string(HTML_LOGIN)

        if sucesso:
            session["usuario"] = usuario
            session["senha"] = senha
            flash(f"Bem-vindo(a), {usuario}!", "success")
            return redirect(url_for("rota_dashboard"))
        else:
            flash("Usuário ou senha inválidos no G-MUS.", "danger")

    return render_template_string(HTML_LOGIN)


@app.route("/logout")
def rota_logout():
    session.clear()
    return redirect(url_for("rota_login"))


@app.route("/")
@login_obrigatorio
def rota_dashboard():
    status_drive = gdrive_sync.status_conexao_gdrive()
    return render_template_string(HTML_DASHBOARD, gdrive_status=status_drive)


@app.route("/api/iniciar_extracao", methods=["POST"])
@login_obrigatorio
def api_iniciar_extracao():
    usuario = session["usuario"]
    senha = session.get("senha")
    dados = request.get_json() or {}
    microarea = str(dados.get("microarea", "4")).strip() or "4"
    threads = int(dados.get("threads", 5))

    tarefas_extracao[usuario] = {
        "progresso": 5,
        "mensagem": "Autenticando sessão no G-MUS...",
        "concluido": False,
        "erro": None,
        "logs": [f"[{datetime.now().strftime('%H:%M:%S')}] Iniciando extração da Microárea {microarea} para {usuario}..."],
        "web_link": None
    }

    def executar():
        tarefa = tarefas_extracao[usuario]
        try:
            sessao = app_cli.criar_sessao_http()
            args_mock = type("Args", (), {
                "user": usuario,
                "password": senha,
                "cookie": None,
                "forcar_login": True,
                "microarea": microarea,
                "threads": threads,
                "domicilios": None
            })()

            # 1. Login
            if not app_cli.autenticar_usuario(sessao, args_mock):
                tarefa["erro"] = "Falha de autenticação ao conectar no G-MUS."
                return

            tarefa["progresso"] = 15
            tarefa["mensagem"] = "Mapeando domicílios em memória..."
            tarefa["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Mapeando páginas de domicílios...")

            # 2. Domicílios
            domicilios, df_dom, _ = app_cli.obter_domicilios(sessao, args_mock)
            if not domicilios:
                tarefa["erro"] = "Nenhum domicílio encontrado para esta microárea."
                return

            tarefa["progresso"] = 35
            tarefa["mensagem"] = f"Extraindo pacientes ({len(domicilios)} residências)..."
            tarefa["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] {len(domicilios)} residências encontradas. Disparando {threads} conexões simultâneas...")

            # 3. Pacientes
            pacientes_coletados = []
            with ThreadPoolExecutor(max_workers=threads) as executor:
                futuros = {executor.submit(app_cli.extrair_membros_domicilio, sessao, dom): dom for dom in domicilios}
                concluidos = 0
                for f in as_completed(futuros):
                    res = f.result()
                    if res:
                        pacientes_coletados.extend(res)
                    concluidos += 1
                    pct = 35 + int((concluidos / len(domicilios)) * 45)
                    tarefa["progresso"] = pct
                    tarefa["mensagem"] = f"Extraindo pacientes: {len(pacientes_coletados)} cadastros ({concluidos}/{len(domicilios)})..."

            tarefa["progresso"] = 85
            tarefa["mensagem"] = "Compilando Planilha Única Multi-Abas com IA e Cálculos Clínicos..."
            tarefa["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Compilando planilha única individual...")

            # 4. Geração da Planilha Única Individual do Usuário
            caminho_final = obter_caminho_planilha_usuario(usuario, microarea)
            df_p = pd.DataFrame(pacientes_coletados)
            if "CPF" in df_p.columns:
                df_p["CPF"] = df_p["CPF"].apply(analisador_gmus.limpar_cpf)

            analisador_gmus.gerar_relatorio_completo_excel(
                df_pacientes=df_p,
                df_domicilios=df_dom,
                caminho_saida=caminho_final
            )

            # Salva também a cópia geral principal
            import shutil
            shutil.copy2(caminho_final, os.path.join(DIRETORIO_ATUAL, "Relatorio_Microarea_Completo.xlsx"))

            tarefa["progresso"] = 92
            tarefa["mensagem"] = "Sincronizando com o Google Drive da Unidade..."
            tarefa["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Enviando para a nuvem do Google Drive...")

            # 5. Sincronização Google Drive
            nome_drive = f"Relatorio_Microarea_{microarea}_{usuario}.xlsx"
            res_drive = gdrive_sync.fazer_upload_planilha_gdrive(
                caminho_arquivo_local=caminho_final,
                nome_arquivo_drive=nome_drive,
                usuario=usuario,
                microarea=microarea
            )

            tarefa["progresso"] = 100
            tarefa["concluido"] = True
            tarefa["web_link"] = res_drive.get("web_link")
            tarefa["mensagem"] = "Processo 100% concluído!"
            tarefa["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Sucesso! Arquivo pronto no Google Drive e para download local.")

        except Exception as e:
            tarefa["erro"] = str(e)
            tarefa["logs"].append(f"[!] Erro crítico: {e}")

    threading.Thread(target=executar, daemon=True).start()
    return jsonify({"status": "iniciado"})


@app.route("/api/status_extracao")
@login_obrigatorio
def api_status_extracao():
    usuario = session["usuario"]
    tarefa = tarefas_extracao.get(usuario, {
        "progresso": 0,
        "mensagem": "Nenhuma extração em andamento.",
        "concluido": False,
        "erro": None,
        "logs": []
    })
    return jsonify(tarefa)


@app.route("/api/buscar")
@login_obrigatorio
def api_buscar():
    termo = request.args.get("termo", "").strip()
    if not termo:
        return jsonify({"resultados": []})

    arquivo = os.path.join(DIRETORIO_ATUAL, "Relatorio_Microarea_Completo.xlsx")
    if not os.path.exists(arquivo):
        return jsonify({"resultados": [], "erro": "Nenhum relatório gerado ainda."})

    try:
        df = pd.read_excel(
            arquivo,
            sheet_name="👥 Todos os Moradores",
            dtype={"CPF": str, "CNS": str, "Código": str, "Celular": str, "DDD": str, "Domicílio_ID": str, "Numero": str}
        )

        termo_str = str(termo).strip()
        termo_num = re.sub(r"\D", "", termo_str)

        mask = (
            df["Nome"].astype(str).str.contains(termo_str, case=False, na=False) |
            df["Código"].astype(str).str.contains(termo_str, case=False, na=False) |
            df["Domicílio_ID"].astype(str).str.contains(termo_str, case=False, na=False) |
            df["Rua"].astype(str).str.contains(termo_str, case=False, na=False)
        )

        if termo_num:
            mask = mask | (
                df["CPF"].apply(analisador_gmus.limpar_cpf).str.contains(termo_num, na=False) |
                df["CNS"].astype(str).str.contains(termo_num, na=False)
            )

        res = df[mask].head(25)
        # Substitui NaN por string vazia para serializar JSON
        res = res.fillna("").to_dict(orient="records")
        return jsonify({"resultados": res})

    except Exception as e:
        return jsonify({"resultados": [], "erro": str(e)})


@app.route("/download")
@login_obrigatorio
def rota_download():
    usuario = session["usuario"]
    # Tenta achar a planilha do usuário ou a principal
    limpo = re.sub(r"\W+", "_", str(usuario)).strip("_")
    for f in os.listdir(PASTA_PLANILHAS):
        if f.endswith(f"_{limpo}.xlsx"):
            return send_file(os.path.join(PASTA_PLANILHAS, f), as_attachment=True)

    arquivo_padrao = os.path.join(DIRETORIO_ATUAL, "Relatorio_Microarea_Completo.xlsx")
    if os.path.exists(arquivo_padrao):
        return send_file(arquivo_padrao, as_attachment=True, download_name=f"Relatorio_{limpo}.xlsx")

    flash("Nenhuma planilha encontrada para download. Execute uma extração primeiro.", "warning")
    return redirect(url_for("rota_dashboard"))


if __name__ == "__main__":
    porta = int(os.environ.get("PORT", 5000))
    print("\n" + "=" * 65)
    print(f"🚀 SERVIDOR WEB G-MUS RODANDO EM: http://0.0.0.0:{porta}")
    print("=" * 65)
    app.run(host="0.0.0.0", port=porta, debug=False)
