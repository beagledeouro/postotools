"""
Módulo de Sincronização Automática com o Google Drive (Opção 1)
Compatível com Conta de Serviço (Service Account) ou OAuth2.
"""

import os
import io
import json
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

DIRETORIO_ATUAL = os.path.dirname(os.path.abspath(__file__))
ARQUIVO_SERVICE_ACCOUNT = os.path.join(DIRETORIO_ATUAL, "gdrive_service_account.json")
ARQUIVO_CREDENCIAIS_OAUTH = os.path.join(DIRETORIO_ATUAL, "gdrive_credentials.json")
ARQUIVO_TOKEN_OAUTH = os.path.join(DIRETORIO_ATUAL, "gdrive_token.json")
PASTA_LOCAL_BACKUP = os.path.join(DIRETORIO_ATUAL, "planilhas_drive_local")

SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def status_conexao_gdrive() -> dict:
    """Verifica se há credenciais válidas configuradas para o Google Drive."""
    # 1. Variável de Ambiente (Ideal para Render e Nuvem)
    env_json = os.environ.get("GDRIVE_SERVICE_ACCOUNT_JSON")
    if env_json:
        try:
            dados = json.loads(env_json)
            email = dados.get("client_email", "Conta de Serviço (Nuvem)")
            return {
                "configurado": True,
                "metodo": "Conta de Serviço (Variável de Ambiente Render)",
                "email": email,
                "detalhe": f"Pronto para salvar no Drive! Pasta compartilhada com: {email}"
            }
        except Exception as e:
            return {"configurado": False, "erro": str(e)}

    # 2. Arquivo Local JSON (Ideal para desenvolvimento local)
    if os.path.exists(ARQUIVO_SERVICE_ACCOUNT):
        try:
            with open(ARQUIVO_SERVICE_ACCOUNT, "r", encoding="utf-8") as f:
                dados = json.load(f)
                email = dados.get("client_email", "Conta de Serviço")
                return {
                    "configurado": True,
                    "metodo": "Conta de Serviço (Arquivo JSON)",
                    "email": email,
                    "detalhe": f"Pronto para salvar no Drive! Pasta compartilhada com: {email}"
                }
        except Exception as e:
            return {"configurado": False, "erro": str(e)}

    if os.path.exists(ARQUIVO_TOKEN_OAUTH):
        return {
            "configurado": True,
            "metodo": "OAuth2 (Conectado via autorização de usuário)",
            "email": "E-mail do Posto Autenticado",
            "detalhe": "Token ativo para upload direto."
        }

    return {
        "configurado": False,
        "metodo": "Nenhum",
        "detalhe": "Aguardando credenciais do Google Drive (gdrive_service_account.json ou variável GDRIVE_SERVICE_ACCOUNT_JSON)."
    }


def obter_servico_drive():
    """Autentica e retorna o serviço da API do Google Drive."""
    creds = None

    # Método 1A: Variável de Ambiente (Render / Nuvem)
    env_json = os.environ.get("GDRIVE_SERVICE_ACCOUNT_JSON")
    if env_json:
        try:
            dados = json.loads(env_json)
            creds = service_account.Credentials.from_service_account_info(
                dados, scopes=SCOPES
            )
            return build("drive", "v3", credentials=creds)
        except Exception as e:
            print(f"[!] Erro ao carregar credenciais da variável de ambiente: {e}")

    # Método 1B: Arquivo Local Conta de Serviço (Service Account)
    if os.path.exists(ARQUIVO_SERVICE_ACCOUNT):
        creds = service_account.Credentials.from_service_account_file(
            ARQUIVO_SERVICE_ACCOUNT, scopes=SCOPES
        )
        return build("drive", "v3", credentials=creds)

    # Método 2: OAuth2 Token
    if os.path.exists(ARQUIVO_TOKEN_OAUTH):
        creds = Credentials.from_authorized_user_file(ARQUIVO_TOKEN_OAUTH, SCOPES)

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(ARQUIVO_TOKEN_OAUTH, "w") as token:
                token.write(creds.to_json())
        except Exception:
            creds = None

    if not creds and os.path.exists(ARQUIVO_CREDENCIAIS_OAUTH):
        flow = InstalledAppFlow.from_client_secrets_file(ARQUIVO_CREDENCIAIS_OAUTH, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(ARQUIVO_TOKEN_OAUTH, "w") as token:
            token.write(creds.to_json())

    if creds:
        return build("drive", "v3", credentials=creds)

    return None


def obter_ou_criar_pasta(service, nome_pasta: str, parent_id: str = None) -> str:
    """Busca uma pasta pelo nome ou cria se não existir."""
    query = f"mimeType = 'application/vnd.google-apps.folder' and name = '{nome_pasta}' and trashed = false"
    if parent_id:
        query += f" and '{parent_id}' in parents"

    try:
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get("files", [])
        if files:
            return files[0]["id"]

        # Se não existe, cria a pasta
        file_metadata = {
            "name": nome_pasta,
            "mimeType": "application/vnd.google-apps.folder"
        }
        if parent_id:
            file_metadata["parents"] = [parent_id]

        folder = service.files().create(body=file_metadata, fields="id").execute()
        return folder.get("id")
    except Exception as e:
        print(f"[!] Erro ao gerenciar pasta no Drive: {e}")
        return None


def fazer_upload_planilha_gdrive(
    caminho_arquivo_local: str,
    nome_arquivo_drive: str,
    usuario: str,
    microarea: str
) -> dict:
    """
    Realiza o upload ou atualização da planilha única no Google Drive.
    Cria automaticamente a estrutura de pastas:
    G-MUS_Microareas / Microarea_X / <usuario>.xlsx
    """
    os.makedirs(PASTA_LOCAL_BACKUP, exist_ok=True)

    service = obter_servico_drive()
    if not service:
        # Modo Fallback: Salva na pasta local organizada se ainda não configurou as chaves do Google
        pasta_user = os.path.join(PASTA_LOCAL_BACKUP, f"Microarea_{microarea}", usuario)
        os.makedirs(pasta_user, exist_ok=True)
        destino = os.path.join(pasta_user, nome_arquivo_drive)

        import shutil
        shutil.copy2(caminho_arquivo_local, destino)

        return {
            "sucesso": False,
            "gdrive": False,
            "motivo": "Credenciais do Google Drive ainda não configuradas.",
            "caminho_local": destino,
            "web_link": None
        }

    try:
        # 1. Pasta Raiz: G-MUS_Microareas
        id_pasta_raiz = obter_ou_criar_pasta(service, "G-MUS_Microareas")

        # 2. Subpasta da Microárea (ex: Microarea_04)
        id_pasta_ma = obter_ou_criar_pasta(service, f"Microarea_{microarea}", parent_id=id_pasta_raiz)

        # 3. Verifica se a planilha do usuário já existe nessa pasta (para atualizar em vez de duplicar)
        query = f"name = '{nome_arquivo_drive}' and '{id_pasta_ma}' in parents and trashed = false"
        results = service.files().list(q=query, fields="files(id, name, webViewLink)").execute()
        arquivos = results.get("files", [])

        media = MediaFileUpload(
            caminho_arquivo_local,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            resumable=True
        )

        if arquivos:
            # Atualiza arquivo existente
            file_id = arquivos[0]["id"]
            updated_file = service.files().update(
                fileId=file_id,
                media_body=media,
                fields="id, name, webViewLink"
            ).execute()
            link = updated_file.get("webViewLink")
            print(f"[✓] Planilha atualizada com sucesso no Google Drive: {link}")
            return {
                "sucesso": True,
                "gdrive": True,
                "acao": "atualizada",
                "file_id": file_id,
                "web_link": link,
                "nome": nome_arquivo_drive
            }
        else:
            # Cria novo arquivo no Drive
            file_metadata = {
                "name": nome_arquivo_drive,
                "parents": [id_pasta_ma]
            }
            new_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields="id, name, webViewLink"
            ).execute()
            link = new_file.get("webViewLink")
            print(f"[✓] Nova planilha enviada com sucesso ao Google Drive: {link}")
            return {
                "sucesso": True,
                "gdrive": True,
                "acao": "criada",
                "file_id": new_file.get("id"),
                "web_link": link,
                "nome": nome_arquivo_drive
            }

    except Exception as e:
        print(f"[✗] Falha no upload para o Google Drive: {e}")
        return {
            "sucesso": False,
            "gdrive": False,
            "motivo": str(e),
            "web_link": None
        }
