from flask import Flask, jsonify, request, send_from_directory, render_template, session, redirect
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import mysql.connector
import os
import uuid
import requests



# ====================================================
# CONFIGURAÇÃO
# ====================================================
load_dotenv(override=False)


app = Flask(__name__)
CORS(app)

# 🔒 CHAVE SECRETA DA SESSÃO — MUITO IMPORTANTE!
app.secret_key = os.getenv("SECRET_KEY", "mude_para_uma_chave_secreta_segura_no_env")

# 👤 DADOS DE ACESSO DO MARCOS — lidos do arquivo .env
USUARIO_ADMIN = os.getenv("ADMIN_USUARIO", "marcos")
SENHA_ADMIN = os.getenv("ADMIN_SENHA", "")


# Configuração do Cloudinary para armazenar as novas fotos





# Pasta onde as fotos serão salvas
UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "uploads"
)

UPLOAD_FOLDER = os.path.abspath(UPLOAD_FOLDER)
print("PASTA DAS FOTOS:", UPLOAD_FOLDER)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp"
}


# ====================================================
# CONEXÃO COM O MYSQL
# ====================================================


def conectar_banco():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        connection_timeout=15
    )


# ====================================================
# FUNÇÃO AUXILIAR — VERIFICAR SE ESTÁ LOGADO
# ====================================================
def esta_logado():
    return session.get('logado', False)


# ====================================================
# VERIFICAR EXTENSÃO DA FOTO
# ====================================================

def arquivo_permitido(nome):
    return (
        "." in nome
        and nome.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ====================================================
# 🚪 SISTEMA DE LOGIN
# ====================================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form.get('usuario', '')
        senha = request.form.get('senha', '')
        
        if usuario == USUARIO_ADMIN and senha == SENHA_ADMIN:
            session['logado'] = True
            return redirect('/dashboard')
        
        return render_template('login.html', erro="Usuário ou senha incorretos!")
    
    return render_template('login.html')


@app.route('/sair')
def sair():
    session.clear()
    return redirect('/login')


# ====================================================
# 🛡️ ROTAS PROTEGIDAS — PÁGINAS HTML DO ADMIN
# ====================================================

@app.route('/dashboard')
def pagina_dashboard():
    if not esta_logado():
        return redirect('/login')
    return render_template('dashboard.html')


@app.route('/cadastrar-imovel')
def pagina_cadastrar_imovel():
    if not esta_logado():
        return redirect('/login')
    return render_template('cadastrar-imovel.html')


@app.route('/leads-painel')
def pagina_leads():
    if not esta_logado():
        return redirect('/login')
    return render_template('leads.html')


# ====================================================
# TESTE DA API
# ====================================================

@app.route("/")
def inicio():
    return jsonify({
        "mensagem": "API da imobiliária funcionando!"
    })


# ====================================================
# TESTE DO MYSQL
# ====================================================

@app.route("/teste-banco")
def teste_banco():

    try:

        conexao = conectar_banco()

        if conexao.is_connected():

            conexao.close()

            return jsonify({
                "mensagem": "MySQL conectado com sucesso!"
            })

    except mysql.connector.Error as erro:

        return jsonify({
            "erro": str(erro)
        }), 500


# ====================================================
# DISPONIBILIZAR FOTOS
# ====================================================

@app.route("/uploads/<path:nome_arquivo>")
def servir_foto(nome_arquivo):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        nome_arquivo
    )


# ====================================================
# CADASTRAR IMÓVEL + FOTOS — continua público pela API
# ====================================================

@app.route("/imoveis", methods=["POST"])
def cadastrar_imovel():

    conexao = None
    cursor = None

    try:

        # --------------------------------------------
        # DADOS DO FORMULÁRIO
        # --------------------------------------------

        dados = request.form

        titulo = dados.get("titulo", "")
        tipo = dados.get("tipo", "")
        negocio = dados.get("negocio", "")
        preco = dados.get("preco", "")
        cidade = dados.get("cidade", "")
        bairro = dados.get("bairro", "")
        quartos = dados.get("quartos", 0)
        banheiros = dados.get("banheiros", 0)
        vagas = dados.get("vagas", 0)
        descricao = dados.get("descricao", "")
        destaque = dados.get("destaque", "false").lower() == "true"


        # --------------------------------------------
        # CONEXÃO
        # --------------------------------------------

        conexao = conectar_banco()

        cursor = conexao.cursor()


        # --------------------------------------------
        # CADASTRAR IMÓVEL
        # --------------------------------------------

        sql_imovel = """
        INSERT INTO imoveis (
            titulo,
            tipo,
            negocio,
            preco,
            cidade,
            bairro,
            quartos,
            banheiros,
            vagas,
            descricao,
            destaque
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """


        valores_imovel = (
            titulo,
            tipo,
            negocio,
            preco,
            cidade,
            bairro,
            quartos,
            banheiros,
            vagas,
            descricao,
            destaque
        )


        cursor.execute(
            sql_imovel,
            valores_imovel
        )


        novo_id = cursor.lastrowid


        # --------------------------------------------
        # FOTOS
        # --------------------------------------------

        arquivos = request.files.getlist("fotos")

        caminhos_fotos = []


        for arquivo in arquivos:

            if arquivo and arquivo.filename:

                if not arquivo_permitido(
                    arquivo.filename
                ):
                    continue


                # Enviar a foto para o Cloudinary
                import requests

        url_imgbb = "https://api.imgbb.com/1/upload"
        chave_api = os.getenv("IMGBB_API_KEY")

        resposta = requests.post(
            url_imgbb,
            data = {
                "key": chave_api,
                "image": arquivo
            },
            timeout=15
        )

        dados = resposta.json()
        print("Resposta que veio do ImgBB",dados)
        caminho_banco = dados["data"]["url"]

        if not caminho_banco:
            raise Exception("O ImgBB não retornou o endereço da foto.")


            sql_foto = """
                INSERT INTO fotos_imoveis (
                    imovel_id,
                    caminho
                )
                VALUES (%s, %s)
                """


            cursor.execute(
                    sql_foto,
                    (
                        novo_id,
                        caminho_banco
                    )
                )


            caminhos_fotos.append(
                    caminho_banco
                )


        # --------------------------------------------
        # CONFIRMAR
        # --------------------------------------------

        conexao.commit()


        return jsonify({

            "mensagem":
                "Imóvel cadastrado com sucesso!",

            "id":
                novo_id,

            "fotos":
                caminhos_fotos

        }), 201


    except Exception as erro:

        if conexao:
            conexao.rollback()


        return jsonify({
            "erro": str(erro)
        }), 500


    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ====================================================
# LISTAR IMÓVEIS — continua público pela API
# ====================================================

@app.route("/imoveis", methods=["GET"])
def listar_imoveis():

    conexao = None
    cursor = None
    cursor_fotos = None

    try:

        conexao = conectar_banco()

        cursor = conexao.cursor(
            dictionary=True
        )


        sql = """
        SELECT
            id,
            titulo,
            tipo,
            negocio,
            preco,
            cidade,
            bairro,
            quartos,
            banheiros,
            vagas,
            descricao,
            destaque
        FROM imoveis
        ORDER BY id DESC
        """


        cursor.execute(sql)

        imoveis = cursor.fetchall()


        # --------------------------------------------
        # BUSCAR FOTOS
        # --------------------------------------------

        cursor_fotos = conexao.cursor(
            dictionary=True
        )


        sql_fotos = """
        SELECT
            id,
            imovel_id,
            caminho
        FROM fotos_imoveis
        WHERE imovel_id = %s
        ORDER BY id ASC
        """


        for imovel in imoveis:

            cursor_fotos.execute(
                sql_fotos,
                (imovel["id"],)
            )


            fotos = cursor_fotos.fetchall()


            imovel["fotos"] = [
                foto["caminho"]
                for foto in fotos
            ]


        return jsonify(
            imoveis
        ), 200


    except mysql.connector.Error as erro:

        return jsonify({
            "erro": str(erro)
        }), 500


    finally:

        if cursor_fotos:
            cursor_fotos.close()

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ====================================================
# EXCLUIR IMÓVEL
# ====================================================

@app.route(
    "/imoveis/<int:imovel_id>",
    methods=["DELETE"]
)
def excluir_imovel(imovel_id):

    conexao = None
    cursor = None

    try:

        conexao = conectar_banco()

        cursor = conexao.cursor()


        sql = """
        DELETE FROM imoveis
        WHERE id = %s
        """


        cursor.execute(
            sql,
            (imovel_id,)
        )


        if cursor.rowcount == 0:

            conexao.rollback()

            return jsonify({
                "erro": "Imóvel não encontrado."
            }), 404


        conexao.commit()


        return jsonify({
            "mensagem":
                "Imóvel excluído com sucesso!"
        }), 200


    except mysql.connector.Error as erro:

        if conexao:
            conexao.rollback()


        return jsonify({
            "erro": str(erro)
        }), 500


    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ====================================================
# RECEBER CONTATOS DO SITE — PÚBLICO
# ====================================================

@app.route('/leads', methods=['POST'])
def cadastrar_lead():
    dados = request.get_json(silent=True) or {}

    nome = (dados.get('nome') or '').strip()
    email = (dados.get('email') or '').strip()
    telefone = (dados.get('telefone') or '').strip()
    interesse = (dados.get('interesse') or '').strip()
    mensagem = (dados.get('mensagem') or '').strip()

    if not nome or not email:
        return jsonify({
            'erro': 'Preencha o nome e o e-mail.'
        }), 400

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor()

        sql = """
            INSERT INTO leads
                (nome, email, telefone, interesse, mensagem)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(sql, (
            nome,
            email,
            telefone,
            interesse,
            mensagem
        ))

        conexao.commit()

        return jsonify({
            'mensagem': 'Contato salvo com sucesso!'
        }), 201

    except Exception as erro:
        if conexao:
            conexao.rollback()

        print('Erro ao salvar lead:', erro)

        return jsonify({
            'erro': 'Não foi possível salvar o contato.'
        }), 500
    
    finally:
            if cursor:
                cursor.close()
            if conexao:
                conexao.close()

# ====================================================
# LISTAR LEADS — 🔒 PROTEGIDA POR LOGIN
# ====================================================

@app.route('/leads', methods=['GET'])
def listar_leads():
    # ⚠️ Verifica se é uma requisição do navegador (página) ou da API
    # Se vier do navegador sem estar logado, manda pro login
    if request.headers.get('Accept', '').find('text/html') != -1:
        if not esta_logado():
            return redirect('/login')

    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor(dictionary=True)

        sql = """
            SELECT id, nome, email, telefone, interesse, mensagem
            FROM leads
            ORDER BY id DESC
        """

        cursor.execute(sql)
        leads = cursor.fetchall()

        return jsonify(leads), 200

    except mysql.connector.Error as erro:
        print("Erro ao consultar leads:", erro)

        return jsonify({
            "erro": "Não foi possível consultar os contatos."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conexao:
            conexao.close()

                
if __name__ == "__main__":
    app.run(debug=True)
