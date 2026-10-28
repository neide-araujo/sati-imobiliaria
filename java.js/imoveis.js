 const API_IMOVEIS_URL = 'http://127.0.0.1:5000';
 

// =====================================================
// BUSCAR IMÓVEIS NO BANCO DE DADOS
// =====================================================

async function buscarImoveis() {
    const resposta = await fetch(`${API_IMOVEIS_URL}/imoveis`);

    if (!resposta.ok) {
        throw new Error('Erro ao buscar imóveis.');
    }

    return await resposta.json();
}

// =====================================================
// FORMATAR PREÇO
// =====================================================

function formatarPreco(preco) {
    const valor = Number(preco);

    if (isNaN(valor)) {
        return 'Consulte o valor';
    }

    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// =====================================================
// CARREGAR IMÓVEIS NA PÁGINA INICIAL
// =====================================================

async function carregarImoveisHome() {
    const container = document.getElementById('cardsImoveis');

    if (!container) {
        return;
    }

    try {
        const imoveis = await buscarImoveis();

        container.innerHTML = '';

        imoveis.forEach(imovel => {

            const foto =
                imovel.fotos &&
                imovel.fotos.length > 0
                    ? `${API_URL}/${imovel.fotos[0]}`
                    : 'img/casa-1.jpg';

            const card = document.createElement('div');

            card.className = 'card';

            card.innerHTML = `
                <img
                    src="${foto}"
                    alt="${imovel.titulo || 'Imóvel'}"
                >

                <div class="card-conteudo">

                    <span class="tipo-imovel">
                        ${imovel.tipo || ''}
                    </span>

                    <h3>
                        ${imovel.titulo || 'Sem título'}
                    </h3>

                    <p>
                        ${imovel.descricao || 'Descrição não informada.'}
                    </p>

                    <div class="detalhes">

                        <span>
                            ${imovel.quartos || 0}
                            Quartos
                        </span>

                        <span>
                            ${imovel.banheiros || 0}
                            Banheiros
                        </span>

                        <span>
                            ${imovel.vagas || 0}
                            Vagas
                        </span>

                    </div>

                    <strong class="preco">
                        ${formatarPreco(imovel.preco)}
                    </strong>

                    <a
                    href="imoveis.html?id=${imovel.id}"
                        class="botao"
                    >
                        Ver o imóvel
                    </a>

                </div>
            `;

            container.appendChild(card);
        });

    } catch (erro) {

        console.error(
            'Erro ao carregar imóveis na Home:',
            erro
        );
    }
}

// =====================================================
// CARREGAR DETALHES DO IMÓVEL
// =====================================================

async function carregarDetalhesImovel() {

    const parametros =
        new URLSearchParams(window.location.search);

    const id = parametros.get('id');

    // Se não existe ID, não estamos na página de detalhes
    if (!id) {
        return;
    }

    try {

        const imoveis = await buscarImoveis();

        const imovel = imoveis.find(
            item => Number(item.id) === Number(id)
        );

        // =================================================
        // IMÓVEL NÃO ENCONTRADO
        // =================================================

        if (!imovel) {

            console.error('Imóvel não encontrado.');

            const titulo =
                document.getElementById('tituloImovel');

            if (titulo) {
                titulo.textContent =
                    'Imóvel não encontrado.';
            }

            return;
        }

        // =================================================
        // PEGAR ELEMENTOS DA PÁGINA
        // =================================================

        const tipo =
            document.getElementById('tipoImovel');

        const titulo =
            document.getElementById('tituloImovel');

        const descricao =
            document.getElementById('descricaoImovel');

        const quartos =
            document.getElementById('quartosImovel');

        const banheiros =
            document.getElementById('banheirosImovel');

        const vagas =
            document.getElementById('vagasImovel');

        const preco =
            document.getElementById('precoImovel');

        const fotoPrincipal =
            document.getElementById('fotoPrincipal');

        const listaMiniaturas =
            document.getElementById('listaMiniaturas');

        // =================================================
        // PREENCHER DADOS DO IMÓVEL
        // =================================================

        if (tipo) {
            tipo.textContent =
                imovel.tipo || '';
        }

        if (titulo) {
            titulo.textContent =
                imovel.titulo || 'Sem título';
        }

        if (descricao) {
            descricao.textContent =
                imovel.descricao ||
                'Descrição não informada.';
        }

        if (quartos) {
            quartos.textContent =
                imovel.quartos || 0;
        }

        if (banheiros) {
            banheiros.textContent =
                imovel.banheiros || 0;
        }

        if (vagas) {
            vagas.textContent =
                imovel.vagas || 0;
        }

        if (preco) {
            preco.textContent =
                formatarPreco(imovel.preco);
        }

        // =================================================
        // VERIFICAR FOTOS
        // =================================================

        if (
            !imovel.fotos ||
            imovel.fotos.length === 0
        ) {

            console.log(
                'Este imóvel não possui fotos.'
            );

            return;
        }

        // =================================================
        // VARIÁVEIS DA GALERIA
        // =================================================

        let indiceFotoAtual = 0;

        // =================================================
        // FUNÇÃO PARA PEGAR O CAMINHO DA FOTO
        // =================================================
        function caminhoFoto(indice) {
        return `${API_IMOVEIS_URL}/${imovel.fotos[indice]}`;
     }

        // =================================================
        // MOSTRAR FOTO PRINCIPAL
        // =================================================

        function mostrarFoto(indice) {

            indiceFotoAtual = indice;

            if (!fotoPrincipal) {
                return;
            }

            fotoPrincipal.src =
                caminhoFoto(indiceFotoAtual);

            fotoPrincipal.alt =
                `${imovel.titulo || 'Imóvel'} - Foto ${indiceFotoAtual + 1}`;
        }

        // =================================================
        // MOSTRAR PRIMEIRA FOTO
        // =================================================

        mostrarFoto(0);

        // =================================================
        // CRIAR MINIATURAS
        // =================================================

        if (listaMiniaturas) {

            listaMiniaturas.innerHTML = '';

            imovel.fotos.forEach(
                (foto, indice) => {

                    const miniatura =
                        document.createElement('img');

                    miniatura.src =
                        caminhoFoto(indice);

                    miniatura.alt =
                        `${imovel.titulo || 'Imóvel'} - Foto ${indice + 1}`;

                    miniatura.className =
                        'miniatura-imovel';

                    miniatura.addEventListener('click', () => {
                    mostrarFoto(indice);
                    abrirFotoAmpliada();
                     

                        }
                    );

                    listaMiniaturas.appendChild(
                        miniatura
                    );
                }
            );
        }

        // =================================================
        // ELEMENTOS DO MODAL
        // =================================================

        const modalFoto =
            document.getElementById('modalFoto');

        const fotoZoom =
            document.getElementById('fotoZoom');

        const fecharModal =
            document.getElementById('fecharModal');

        const fotoAnterior =
            document.getElementById('fotoAnterior');

        const proximaFoto =
            document.getElementById('proximaFoto');

            function abrirFotoAmpliada() {
    if (!modalFoto || !fotoZoom) {
        return;
    }

    fotoZoom.src = caminhoFoto(indiceFotoAtual);
    fotoZoom.alt =
        `${imovel.titulo || 'Imóvel'} - Foto ${indiceFotoAtual + 1}`;

    modalFoto.classList.add('ativo');
    document.body.style.overflow = 'hidden';
    }

        // =================================================
        // ABRIR FOTO AMPLIADA
        // =================================================

        if (
            fotoPrincipal &&
            modalFoto &&
            fotoZoom
        ) {

            fotoPrincipal.addEventListener(
                'click',
                () => {

                    fotoZoom.src =
                        caminhoFoto(indiceFotoAtual);

                    fotoZoom.alt =
                        `${imovel.titulo || 'Imóvel'} - Foto ampliada`;

                    modalFoto.classList.add('ativo');

                    document.body.style.overflow =
                        'hidden';
                }
            );
        }

        // =================================================
        // FECHAR MODAL
        // =================================================

        function fecharZoom() {

            if (modalFoto) {

                modalFoto.classList.remove(
                    'ativo'
                );

                document.body.style.overflow =
                    '';
            }
        }

        // =================================================
        // BOTÃO X
        // =================================================

        if (fecharModal) {

            fecharModal.addEventListener(
                'click',
                fecharZoom
            );
        }

        // =================================================
        // CLICAR FORA DA FOTO
        // =================================================

        if (modalFoto) {

            modalFoto.addEventListener(
                'click',
                evento => {

                    if (
                        evento.target === modalFoto
                    ) {

                        fecharZoom();

                    }
                }
            );
        }

        // =================================================
        // FOTO ANTERIOR
        // =================================================

        if (fotoAnterior) {

            fotoAnterior.addEventListener(
                'click',
                evento => {

                    evento.stopPropagation();

                    indiceFotoAtual--;

                    if (
                        indiceFotoAtual < 0
                    ) {

                        indiceFotoAtual =
                            imovel.fotos.length - 1;
                    }

                    if (fotoZoom) {

                        fotoZoom.src =
                            caminhoFoto(
                                indiceFotoAtual
                            );
                    }
                }
            );
        }

        // =================================================
        // PRÓXIMA FOTO
        // =================================================

        if (proximaFoto) {

            proximaFoto.addEventListener(
                'click',
                evento => {

                    evento.stopPropagation();

                    indiceFotoAtual++;

                    if (
                        indiceFotoAtual >=
                        imovel.fotos.length
                    ) {

                        indiceFotoAtual = 0;
                    }

                    if (fotoZoom) {

                        fotoZoom.src =
                            caminhoFoto(
                                indiceFotoAtual
                            );
                    }
                }
            );
        }

        // =================================================
        // CONTROLE PELO TECLADO
        // =================================================

        document.addEventListener(
            'keydown',
            evento => {

                if (
                    !modalFoto ||
                    !modalFoto.classList.contains(
                        'ativo'
                    )
                ) {

                    return;
                }

                // ESC
                if (
                    evento.key === 'Escape'
                ) {

                    fecharZoom();

                }

                // SETA ESQUERDA
                if (
                    evento.key === 'ArrowLeft'
                ) {

                    indiceFotoAtual--;

                    if (
                        indiceFotoAtual < 0
                    ) {

                        indiceFotoAtual =
                            imovel.fotos.length - 1;
                    }

                    if (fotoZoom) {

                        fotoZoom.src =
                            caminhoFoto(
                                indiceFotoAtual
                            );
                    }
                }

                // SETA DIREITA
                if (
                    evento.key === 'ArrowRight'
                ) {

                    indiceFotoAtual++;

                    if (
                        indiceFotoAtual >=
                        imovel.fotos.length
                    ) {

                        indiceFotoAtual = 0;
                    }

                    if (fotoZoom) {

                        fotoZoom.src =
                            caminhoFoto(
                                indiceFotoAtual
                            );
                    }
                }
            }
        );

        // =================================================
        // CONSOLE
        // =================================================

        console.log(
            'Imóvel carregado:',
            imovel
        );

    } catch (erro) {

        console.error(
            'Erro ao carregar imóvel:',
            erro
        );
    }
}

// =====================================================
// TROCAR FOTO PRINCIPAL
// =====================================================

function trocarFoto(caminho) {

    const fotoPrincipal =
        document.getElementById('fotoPrincipal');

    if (fotoPrincipal) {

        fotoPrincipal.src =
            caminho;
    }
}

// =====================================================
// INICIAR QUANDO A PÁGINA CARREGAR
// =====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        carregarImoveisHome();

        carregarDetalhesImovel();

    }
);