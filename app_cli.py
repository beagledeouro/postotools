#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
 G-MUS Extractor - CLI de Alta Performance (100% Sem Navegador)
 
 Substitui o Selenium e o NiceGUI por requisições HTTP nativas (requests.Session).
 - Zero navegador (sem Edge, Chrome, WebDrivers ou processos fantasma).
 - Extração completa de TODAS as páginas de domicílios e pacientes.
 - 10x a 30x mais rápido graças a requisições diretas e multithreading.
 - Salva os dados continuamente (CSV temporário + Excel final).
===============================================================================
"""

import os
import sys
import json
import time
import getpass
import signal
import re
import urllib.parse
import argparse
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
import pandas as pd

try:
    from tqdm import tqdm
except ImportError:
    class tqdm:
        def __init__(self, iterable=None, total=None, desc="", unit="", **kwargs):
            self.iterable = iterable
            self.total = total or (len(iterable) if iterable else 0)
            self.desc = desc
            self.unit = unit
            self.n = 0
            if self.iterable is not None:
                self._iter = iter(self.iterable)

        def __iter__(self):
            return self

        def __next__(self):
            try:
                item = next(self._iter)
                self.update(1)
                return item
            except StopIteration:
                print()
                raise

        def __enter__(self):
            return self

        def __exit__(self, *args):
            print()

        def update(self, n=1):
            self.n += n
            pct = (self.n / self.total * 100) if self.total else 0
            bar = ("=" * int(pct // 5)).ljust(20, " ")
            print(f"\r[{self.desc}] [{bar}] {self.n}/{self.total} ({pct:.1f}%)", end="", flush=True)

        def set_postfix(self, d):
            pass


# --- CONFIGURAÇÕES DE ROTAS DO G-MUS ---
BASE_URL = "https://saude-gmus.setelagoas.mg.gov.br"
URL_LOGIN_PAGE = f"{BASE_URL}/conta/login"
URL_LOGIN_ACTION = f"{BASE_URL}/padrao/conta/login/"
URL_USUARIOS_PAGE = f"{BASE_URL}/cadastro/usuariogmss"
URL_USUARIOS_LISTA = f"{BASE_URL}/cadastro/usuariogmss/lista"
URL_DOMICILIOS = f"{BASE_URL}/cadastro/domicilio"

DIRETORIO_ATUAL = os.path.dirname(os.path.abspath(__file__))
ARQUIVO_SESSION = os.path.join(DIRETORIO_ATUAL, ".gmus_session.json")
ARQUIVO_RELATORIO_FINAL = os.path.join(DIRETORIO_ATUAL, "Relatorio_Microarea_Completo.xlsx")
ARQUIVO_CHECKPOINT = os.path.join(DIRETORIO_ATUAL, ".gmus_checkpoint_pacientes.csv")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "X-Requested-With": "XMLHttpRequest"
}

interrupcao_solicitada = False
dados_coletados_globais = []
domicilios_coletados_globais = None
csv_lock = threading.Lock()


def handler_interrupcao(signum, frame):
    """Trata cancelamento com Ctrl + C salvando dados imediatamente na planilha única."""
    global interrupcao_solicitada
    print("\n\n[!] Interrupção recebida (Ctrl + C). Salvando os dados já coletados na planilha única...")
    salvar_planilha_unica(dados_coletados_globais, domicilios_coletados_globais)
    sys.exit(0)


signal.signal(signal.SIGINT, handler_interrupcao)


# --- CRIAÇÃO DA SESSÃO HTTP (COM RETRIES E POOL) ---
def criar_sessao_http() -> requests.Session:
    sessao = requests.Session()
    sessao.headers.update(HEADERS)

    estrategia_retry = Retry(
        total=4,
        backoff_factor=1.0,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "POST", "OPTIONS"]
    )
    adaptador = HTTPAdapter(max_retries=estrategia_retry, pool_connections=30, pool_maxsize=30)
    sessao.mount("http://", adaptador)
    sessao.mount("https://", adaptador)
    return sessao


# --- GERENCIAMENTO DE SESSÃO / COOKIES ---
def carregar_sessao_salva(sessao: requests.Session) -> bool:
    if not os.path.exists(ARQUIVO_SESSION):
        return False
    try:
        with open(ARQUIVO_SESSION, "r", encoding="utf-8") as f:
            cookies = json.load(f)
            sessao.cookies.update(cookies)

        resp = sessao.get(f"{BASE_URL}/home", timeout=10)
        if resp.status_code == 200 and "conta/login" not in resp.text and ("id_usuer_logged" in resp.text or "sair" in resp.text):
            return True
    except Exception:
        pass
    return False


def salvar_sessao(sessao: requests.Session):
    try:
        cookies_dict = sessao.cookies.get_dict()
        with open(ARQUIVO_SESSION, "w", encoding="utf-8") as f:
            json.dump(cookies_dict, f, indent=2)
    except Exception:
        pass


def autenticar_usuario(sessao: requests.Session, args) -> bool:
    print("=" * 65)
    print("        G-MUS | AUTOMAÇÃO E EXTRAÇÃO DEMOGRÁFICA")
    print("             (100% Sem Navegador / Modo CLI)")
    print("=" * 65)

    if args.cookie:
        sessao.cookies.set("PHPSESSID", args.cookie, domain="saude-gmus.setelagoas.mg.gov.br", path="/")
        salvar_sessao(sessao)
        print("[✓] Cookie PHPSESSID registrado via argumento!")
        return True

    if not args.forcar_login and carregar_sessao_salva(sessao):
        print("[✓] Sessão ativa recuperada com sucesso! (Ignorando tela de login)")
        return True

    usuario = args.user or os.getenv("GMUS_USER")
    senha = args.password or os.getenv("GMUS_PASS")

    if not usuario or not senha:
        print("\n[+] Nenhuma sessão ativa encontrada. Escolha a forma de autenticação:")
        print("    1. Login com Usuário e Senha (Direto no terminal)")
        print("    2. Entrar informando Cookie PHPSESSID (Sessão já aberta)")

        opcao = input("\nEscolha a opção (1 ou 2) [Padrão: 1]: ").strip() or "1"

        if opcao == "2":
            phpsessid = input("Cole o valor do cookie PHPSESSID: ").strip()
            sessao.cookies.set("PHPSESSID", phpsessid, domain="saude-gmus.setelagoas.mg.gov.br", path="/")
            salvar_sessao(sessao)
            print("[✓] Cookie registrado com sucesso!")
            return True

        if not usuario:
            usuario = input("Usuário G-MUS: ").strip()
        if not senha:
            senha = getpass.getpass("Senha G-MUS: ")

    print("\n[+] Conectando ao G-MUS...")
    try:
        res_page = sessao.get(URL_LOGIN_PAGE, timeout=15)
    except Exception as e:
        print(f"[✗] Erro de rede ao conectar no servidor: {e}")
        return False

    soup = BeautifulSoup(res_page.text, "html.parser")
    campo_usuario = "usuario"
    campo_senha = "senha"

    inp_user = soup.find("input", {"data-user": "user"})
    if inp_user and inp_user.get("name"):
        campo_usuario = inp_user["name"]

    inp_pass = soup.find("input", {"data-pass": "pass"})
    if inp_pass and inp_pass.get("name"):
        campo_senha = inp_pass["name"]

    payload = {
        campo_usuario: usuario,
        campo_senha: senha,
        "usuario": usuario,
        "senha": senha
    }

    headers_login = {
        "Referer": URL_LOGIN_PAGE,
        "Origin": BASE_URL,
        "X-Requested-With": "XMLHttpRequest"
    }

    print("[+] Enviando credenciais de acesso...")
    try:
        resp = sessao.post(URL_LOGIN_ACTION, data=payload, headers=headers_login, timeout=20)
    except Exception as e:
        print(f"[✗] Erro ao enviar requisição de autenticação: {e}")
        return False

    try:
        dados_resp = resp.json()
        if dados_resp.get("success"):
            salvar_sessao(sessao)
            print("[✓] Login autenticado com sucesso!")
            return True
        elif dados_resp.get("msg"):
            print(f"[✗] Erro retornado pelo sistema: {dados_resp.get('msg')}")
            return False
    except Exception:
        pass

    texto_resp = resp.text.lower()
    if '"success":true' in texto_resp.replace(" ", "") or (resp.status_code == 302 and "login" not in resp.headers.get("Location", "")):
        salvar_sessao(sessao)
        print("[✓] Login autenticado com sucesso!")
        return True

    print("[✗] Falha na autenticação: Usuário/senha inválidos ou bloqueio de acesso.")
    return False


# --- FUNÇÕES DE EXTRAÇÃO DE DADOS (HTML -> DICIONÁRIO) ---
def get_v(soup: BeautifulSoup, id_tag: str) -> str:
    el = soup.find(id=id_tag)
    if not el:
        return ""
    val = el.get("value", "").strip()
    return val if val else el.text.strip()


def get_c(soup: BeautifulSoup, id_tag: str) -> str:
    el = soup.find("input", {"id": id_tag})
    if not el:
        return "Não"
    return "Sim" if el.get("checked") is not None else "Não"


def get_dropdown(soup: BeautifulSoup, id_tag: str) -> str:
    select_el = soup.find("select", id=id_tag)
    if select_el:
        opt = select_el.find("option", selected=True)
        if opt:
            return opt.text.strip()
    return ""


def limpar_cpf(v) -> str:
    s = str(v).strip() if v is not None else ""
    if s.endswith(".0"):
        s = s[:-2]
    doc = re.sub(r"\D", "", s)
    if 1 <= len(doc) <= 10:
        doc = doc.zfill(11)
    return doc


# --- FASE 1: MAPEAR TODAS AS PÁGINAS DE DOMICÍLIOS EM MEMÓRIA ---
def obter_domicilios(sessao: requests.Session, args) -> tuple:
    """Mapeia todos os domicílios da microárea diretamente em memória."""
    print("\n" + "=" * 65)
    print("FASE 1: MAPEAMENTO COMPLETO DE DOMICÍLIOS (EM MEMÓRIA)")
    print("=" * 65)

    if args.domicilios and os.path.exists(args.domicilios):
        try:
            df = pd.read_excel(args.domicilios, dtype=str)
            coluna = df.columns[0]
            domicilios = df[coluna].dropna().astype(str).str.strip().tolist()
            print(f"[✓] {len(domicilios)} domicílios carregados do arquivo local: {args.domicilios}")
            return domicilios, df, None
        except Exception as e:
            print(f"[!] Erro ao ler arquivo de domicílios fornecido: {e}. Iniciando coleta online...")

    microarea = args.microarea or ("4" if not sys.stdin.isatty() else input("Filtrar por código de Microárea (ex: 4, 04) [ENTER para padrão 4]: ").strip() or "4")
    print(f"[+] Microárea selecionada: {microarea}")
    print("[+] Consultando microáreas da equipe no G-MUS...")

    domicilios = []
    domicilios_detalhes = []
    id_microarea_alvo = None

    try:
        # 1. Obtém equipe
        r_dom_page = sessao.get(URL_DOMICILIOS, timeout=15)
        soup_page = BeautifulSoup(r_dom_page.text, "html.parser")
        id_equipe = "78"
        inp_equipe = soup_page.find("input", {"id": "id_equipe_filtro"})
        if inp_equipe and inp_equipe.get("value"):
            id_equipe = inp_equipe["value"]

        # 2. Busca lista de microáreas da equipe
        r_micro = sessao.get(f"{URL_DOMICILIOS}/buscarmicroareas/id_equipe_filtro/{id_equipe}", timeout=15)
        soup_micro = BeautifulSoup(r_micro.text, "html.parser")

        abas_ma = []
        for a in soup_micro.find_all("a", href=re.compile(r"#microarea_\d+")):
            href = a.get("href", "")
            id_ma = href.replace("#microarea_", "")
            texto_ma = a.text.strip()
            num_ma = re.search(r"\d+", texto_ma)
            abas_ma.append({
                "id_microarea": id_ma,
                "label": texto_ma,
                "numero": num_ma.group(0) if num_ma else id_ma
            })

        if microarea:
            micro_alvo = str(int(microarea)) if microarea.isdigit() else microarea.lower()
            abas_filtradas = [ma for ma in abas_ma if ma["numero"] == micro_alvo or micro_alvo in ma["label"].lower()]
            if abas_filtradas:
                abas_ma = abas_filtradas
                id_microarea_alvo = abas_filtradas[0]["id_microarea"]

        # 3. Para cada microárea, obtém o formulário filtro e percorre TODAS as páginas
        for ma in abas_ma:
            id_ma = ma["id_microarea"]
            print(f"[+] Conectando na aba {ma['label']} (ID: {id_ma}) e obtendo formulário de filtro...")

            # GET para extrair o formulário com os tokens e campos da microárea
            url_ma_tab = f"{URL_DOMICILIOS}/getdomiciliosmicroarea/id_microarea/{id_ma}/id_equipe/{id_equipe}"
            try:
                r_get = sessao.get(url_ma_tab, timeout=20)
                soup_get = BeautifulSoup(r_get.text, "html.parser")
                form = soup_get.find("form", id=f"filtrodomicilio_{id_ma}") or soup_get.find("form")
            except Exception as e:
                print(f"[!] Erro ao carregar aba da microárea: {e}")
                form = None

            form_data = {}
            if form:
                for inp in form.find_all(["input", "select"]):
                    nome_campo = inp.get("name")
                    if nome_campo:
                        form_data[nome_campo] = inp.get("value", "")

            # Garante que os campos de filtro da microárea estão preenchidos
            form_data[f"id_equipe_{id_ma}"] = id_equipe
            form_data[f"id_micarea_{id_ma}"] = id_ma
            form_data["ordem"] = ""

            pagina = 0
            total_paginas = None
            paginas_vazias_consecutivas = 0

            while True:
                form_data["pg"] = str(pagina)
                url_pag = f"{URL_DOMICILIOS}/getdomiciliosmicroarea"
                try:
                    r_lista = sessao.post(url_pag, data=form_data, timeout=20)
                except Exception as e:
                    print(f"    [!] Erro de conexão na página {pagina + 1}: {e}")
                    break

                # Detecta total de páginas pela paginação do HTML
                if total_paginas is None:
                    m_pag = re.search(r'class=[\"\']page-end[\"\']>\s*/\s*(\d+)', r_lista.text)
                    if m_pag:
                        total_paginas = int(m_pag.group(1))

                soup_lista = BeautifulSoup(r_lista.text, "html.parser")
                novos_nesta_pagina = 0

                # 1. Extração por ID de linha tr (domicilio_362_linha_129885)
                for tr in soup_lista.find_all("tr", id=re.compile(rf"domicilio_{id_ma}_linha_\d+")):
                    m_id = re.search(r"linha_(\d+)", tr.get("id", ""))
                    if m_id:
                        num = m_id.group(1)
                        if num not in domicilios:
                            domicilios.append(num)
                            novos_nesta_pagina += 1
                            tds = [td.text.strip() for td in tr.find_all("td")]
                            det = {"Numero_Domicilio": num}
                            if len(tds) >= 4:
                                det["Status"] = tds[1] if len(tds) > 1 else "Completo"
                                det["Logradouro"] = tds[2] if len(tds) > 2 else ""
                                det["Numero"] = tds[3] if len(tds) > 3 else ""
                            domicilios_detalhes.append(det)

                # 2. Extração por texto "Domicílio:" das famílias
                for st in soup_lista.find_all("strong", string=re.compile(r"Domicílio", re.I)):
                    texto_num = str(st.next_sibling or "").strip().replace('"', '').replace(':', '').replace('-', '').strip()
                    if texto_num and texto_num.isdigit() and texto_num not in domicilios:
                        domicilios.append(texto_num)
                        domicilios_detalhes.append({"Numero_Domicilio": texto_num})
                        novos_nesta_pagina += 1

                total_str = f"/{total_paginas}" if total_paginas else ""
                print(f"    -> Página {pagina + 1}{total_str}: {novos_nesta_pagina} novos domicílios (Total acumulado: {len(domicilios)})")

                if novos_nesta_pagina == 0:
                    paginas_vazias_consecutivas += 1
                    if paginas_vazias_consecutivas >= 2:
                        print(f"[✓] Todas as páginas com dados de {ma['label']} foram processadas!")
                        break
                else:
                    paginas_vazias_consecutivas = 0

                pagina += 1

                if total_paginas and pagina >= (total_paginas + 2):
                    break

    except Exception as e:
        print(f"[!] Aviso na coleta de páginas: {e}")

    df_dom = pd.DataFrame(domicilios_detalhes) if domicilios_detalhes else pd.DataFrame(domicilios, columns=["Numero_Domicilio"])
    print(f"\n[✓] Mapeamento concluído diretamente em memória! Total: {len(domicilios)} domicílios.")

    return domicilios, df_dom, id_microarea_alvo


# --- FASE 2: EXTRAÇÃO DOS PACIENTES (TODAS AS PÁGINAS) ---
def extrair_membros_domicilio(sessao: requests.Session, dom_id: str) -> list:
    """Extrai todas as páginas de pacientes de um domicílio via GET."""
    pacientes_domicilio = []
    pagina = 0

    while True:
        params = {
            "busca_id_domicilio": str(dom_id),
            "pg": str(pagina)
        }

        try:
            resp = sessao.get(URL_USUARIOS_LISTA, params=params, timeout=20)
            if resp.status_code != 200:
                break

            soup_busca = BeautifulSoup(resp.text, "html.parser")
            links_edicao = soup_busca.find_all("a", title=re.compile(r"Editar", re.I))
            if not links_edicao:
                links_edicao = soup_busca.find_all("a", href=re.compile(r"/editar/", re.I))

            if not links_edicao:
                break

            novos_nesta_pagina = 0
            for link in links_edicao:
                href = link.get("href")
                onclick = link.get("onclick", "")
                url_editar = None

                if href and not href.startswith("javascript"):
                    url_editar = urllib.parse.urljoin(BASE_URL, href)
                elif onclick:
                    match = re.search(r"(\d+)", onclick)
                    if match:
                        url_editar = f"{URL_USUARIOS_PAGE}/editar/id/{match.group(1)}"

                if not url_editar:
                    continue

                resp_detalhe = sessao.get(url_editar, timeout=20)
                if resp_detalhe.status_code != 200:
                    continue

                soup_detalhe = BeautifulSoup(resp_detalhe.text, "html.parser")
                info = {
                    "Domicílio_ID": dom_id,
                    "Código": get_v(soup_detalhe, "id_usuario_gms"),
                    "Nome": get_v(soup_detalhe, "no_usuario"),
                    "Sexo": get_dropdown(soup_detalhe, "id_sexo"),
                    "Nascimento": get_v(soup_detalhe, "dt_nascimento"),
                    "CPF": limpar_cpf(get_v(soup_detalhe, "cpf")),
                    "CNS": get_v(soup_detalhe, "nr_cns"),
                    "Mãe": get_v(soup_detalhe, "text_id_mae"),
                    "Pai": get_v(soup_detalhe, "text_id_pai"),
                    "DDD": get_v(soup_detalhe, "end_ddd_celular"),
                    "Celular": get_v(soup_detalhe, "end_nr_fone_celular"),
                    "Rua": get_v(soup_detalhe, "text_end_id_logradouro"),
                    "Numero": get_v(soup_detalhe, "end_nr_logradouro"),
                    "Complemento": get_v(soup_detalhe, "text_id_logradouro"),
                    "Hipertensão": get_c(soup_detalhe, "status_tem_hipertensao_arterial-1"),
                    "Fumante": get_c(soup_detalhe, "status_eh_fumante-1"),
                    "Diabetico": get_c(soup_detalhe, "status_tem_diabetes-1"),
                    "Cardiaco": get_c(soup_detalhe, "status_teve_doenca_cardiaca-1"),
                    "Rins": get_c(soup_detalhe, "status_tem_teve_doencas_rins-1"),
                    "Respiratorio": get_c(soup_detalhe, "status_tem_doenca_respiratorio-1"),
                    "Câncer": get_c(soup_detalhe, "status_tem_teve_cancer-1")
                }

                if info["Nome"] and not any(p.get("Código") == info["Código"] for p in pacientes_domicilio):
                    pacientes_domicilio.append(info)
                    salvar_incremental_csv(info)
                    novos_nesta_pagina += 1

            if novos_nesta_pagina == 0 or len(links_edicao) < 20:
                break

            pagina += 1

        except Exception:
            break

    return pacientes_domicilio


def salvar_incremental_csv(paciente: dict):
    with csv_lock:
        try:
            df = pd.DataFrame([paciente])
            cabecalho = not os.path.exists(ARQUIVO_CHECKPOINT)
            df.to_csv(ARQUIVO_CHECKPOINT, mode="a", header=cabecalho, index=False, encoding="utf-8-sig")
        except Exception:
            pass


def salvar_planilha_unica(dados: list, df_domicilios: pd.DataFrame = None, caminho_saida=ARQUIVO_RELATORIO_FINAL):
    """Consolida os dados e gera diretamente a PLANILHA ÚNICA com todas as abas e dashboard."""
    import analisador_gmus

    df_p = None
    if dados:
        df_p = pd.DataFrame(dados)
    elif os.path.exists(ARQUIVO_CHECKPOINT):
        try:
            df_p = pd.read_csv(
                ARQUIVO_CHECKPOINT,
                encoding="utf-8-sig",
                dtype={"CPF": str, "CNS": str, "Código": str, "Celular": str, "DDD": str, "Domicílio_ID": str, "Numero": str}
            )
        except Exception:
            pass

    if df_p is None or df_p.empty:
        print("[!] Nenhum dado coletado para gerar a planilha.")
        return

    if "CPF" in df_p.columns:
        df_p["CPF"] = df_p["CPF"].apply(limpar_cpf)

    analisador_gmus.gerar_relatorio_completo_excel(
        df_pacientes=df_p,
        df_domicilios=df_domicilios,
        caminho_saida=caminho_saida
    )
    print(f"\n[✓] CONCLUÍDO COM SUCESSO! Planilha única salva em: {caminho_saida}")


# --- ARGPARSE E FLUXO PRINCIPAL ---
def obter_argumentos():
    parser = argparse.ArgumentParser(description="G-MUS Extractor - Extração Unificada em Planilha Única")
    parser.add_argument("-u", "--user", help="Usuário do G-MUS")
    parser.add_argument("-p", "--password", help="Senha do G-MUS")
    parser.add_argument("-c", "--cookie", help="Cookie PHPSESSID diretamente")
    parser.add_argument("-m", "--microarea", default="4", help="Código da Microárea (padrão: 4)")
    parser.add_argument("-t", "--threads", type=int, default=5, help="Número de conexões simultâneas (padrão: 5)")
    parser.add_argument("-d", "--domicilios", help="Caminho opcional para arquivo de domicílios prévio")
    parser.add_argument("-o", "--output", help="Caminho/nome da planilha única gerada (padrão: Relatorio_Microarea_Completo.xlsx)")
    parser.add_argument("--forcar-login", action="store_true", help="Ignora a sessão salva e força novo login")
    parser.add_argument("--buscar", "-b", help="Busca rápida offline de paciente na planilha única")
    parser.add_argument("--relatorio", "-r", action="store_true", help="Regera/atualiza a planilha única a partir dos dados locais")
    return parser.parse_args()


def main():
    global dados_coletados_globais, domicilios_coletados_globais

    args = obter_argumentos()
    caminho_final = args.output or ARQUIVO_RELATORIO_FINAL

    # 0. Ações offline rápidas (sem necessidade de conexão ou login)
    if args.buscar:
        try:
            import analisador_gmus
            analisador_gmus.buscar_offline(args.buscar, arquivo=caminho_final)
        except Exception as e:
            print(f"[!] Erro ao realizar busca offline: {e}")
        return

    if args.relatorio:
        try:
            import analisador_gmus
            analisador_gmus.gerar_relatorio_completo_excel(caminho_saida=caminho_final)
        except Exception as e:
            print(f"[!] Erro ao gerar relatório: {e}")
        return

    sessao = criar_sessao_http()

    # 1. Autenticação
    if not autenticar_usuario(sessao, args):
        print("\n[✗] Autenticação necessária para continuar. Encerrando.")
        sys.exit(1)

    # 2. Mapeamento de TODAS as páginas de domicílios (em memória)
    domicilios, df_domicilios, id_ma = obter_domicilios(sessao, args)
    domicilios_coletados_globais = df_domicilios
    if not domicilios:
        print("[!] Nenhum domicílio para processar. Encerrando.")
        return

    # 3. Extração Multithread de TODAS as páginas de pacientes
    max_workers = args.threads if args.threads >= 1 else 5

    print("\n" + "=" * 65)
    print(f"Iniciando extração profunda de {len(domicilios)} domicílios ({max_workers} conexões em paralelo)...")
    print("=" * 65)

    with tqdm(total=len(domicilios), desc="Progresso Domicílios", unit="dom") as pbar:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futuros = {executor.submit(extrair_membros_domicilio, sessao, dom): dom for dom in domicilios}

            for futuro in as_completed(futuros):
                try:
                    resultado = futuro.result()
                    if resultado:
                        dados_coletados_globais.extend(resultado)
                        pbar.set_postfix({"Pacientes": len(dados_coletados_globais)})
                except Exception:
                    pass
                finally:
                    pbar.update(1)

    # 4. Geração Direta da PLANILHA ÚNICA CONSOLIDADA (Sem planilhas intermediárias!)
    print("\n" + "=" * 65)
    print(f"EXTRAÇÃO FINALIZADA: {len(dados_coletados_globais)} pacientes coletados.")
    print("Gerando Planilha Única Consolidada Multi-Abas...")
    print("=" * 65)

    salvar_planilha_unica(dados_coletados_globais, df_domicilios, caminho_saida=caminho_final)

    # Limpa checkpoint temporário se tudo correu bem
    if os.path.exists(ARQUIVO_CHECKPOINT):
        try:
            os.remove(ARQUIVO_CHECKPOINT)
        except Exception:
            pass

    # Remove planilhas legadas antigas para manter APENAS UMA planilha no diretório
    for legado in [
        os.path.join(DIRETORIO_ATUAL, "Dados_Completos_Pacientes.xlsx"),
        os.path.join(DIRETORIO_ATUAL, "Domicilios_Extraidos.xlsx")
    ]:
        if os.path.exists(legado):
            try:
                os.remove(legado)
            except Exception:
                pass

    print("=" * 65)
    print(f"[✓] PROCESSO 100% CONCLUÍDO EM UMA ÚNICA ETAPA!")
    print(f"[+] Planilha Única gerada: {caminho_final}")
    print("=" * 65)


if __name__ == "__main__":
    main()
