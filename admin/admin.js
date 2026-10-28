// ====================================================
// CONFIGURAÇÃO DA API
// ====================================================

const API_URL = 'http://127.0.0.1:5000';


// ====================================================
// BUSCAR IMÓVEIS
// ====================================================

async function buscarImoveis() {

    const resposta = await fetch(
        `${API_URL}/imoveis`
    );

    if (!resposta.ok) {
        throw new Error(
            'Erro ao buscar imóveis.'
        );
    }

    return await resposta.json();
}


// ====================================================
// FORMATAR PREÇO
// ====================================================

function formatarPreco(preco) {

    if (
        preco === null ||
        preco === undefined ||
        preco === ''
    ) {
        return 'Consulte';
    }

    return 'R$ ' +
        Number(preco).toLocaleString(
            'pt-BR',
            {
                minimumFractionDigits: 2
            }
        );
}


// ====================================================
// CARREGAR DASHBOARD
// ====================================================

async function carregarDashboard() {

    const lista =
        document.getElementById('listaImoveis');

    const total =
        document.getElementById('totalImoveis');


    // Se não estiver no Dashboard,
    // não faz nada.

    if (!lista && !total) {
        return;
    }


    try {

        const imoveis =
            await buscarImoveis();


        console.log(
            'Imóveis do Dashboard:',
            imoveis
        );


        // Atualizar contador

        if (total) {

            total.textContent =
                imoveis.length;

        }


        if (!lista) {
            return;
        }


        lista.innerHTML = '';


        if (imoveis.length === 0) {

            lista.innerHTML = `
                <div class="linha">
                    <span>
                        Nenhum imóvel cadastrado.
                    </span>
                </div>
            `;

            return;
        }


        // Criar linhas

        imoveis.forEach((imovel) => {

            const linha =
                document.createElement('div');

            linha.classList.add('linha');


            linha.innerHTML = `

                <span>
                    ${imovel.titulo || 'Sem título'}
                </span>

                <span>
                    ${imovel.cidade || '-'}
                    ${
                        imovel.bairro
                            ? ' - ' + imovel.bairro
                            : ''
                    }
                </span>

                <span>
                    ${imovel.tipo || '-'}
                </span>

                <span>
                    ${formatarPreco(imovel.preco)}
                </span>

                <span class="status">
                    Disponível
                </span>

                <span>

                    <button
                        type="button"
                        class="botao-excluir"
                        onclick="excluirImovel(${imovel.id})"
                    >
                        Excluir
                    </button>

                </span>

            `;


            lista.appendChild(linha);

        });


    } catch (erro) {

        console.error(
            'Erro ao carregar Dashboard:',
            erro
        );


        if (lista) {

            lista.innerHTML = `
                <div class="linha">
                    <span>
                        Não foi possível carregar os imóveis.
                    </span>
                </div>
            `;

        }

    }

}


// ====================================================
// EXCLUIR IMÓVEL
// ====================================================

async function excluirImovel(id) {

    const confirmar =
        confirm(
            'Tem certeza que deseja excluir este imóvel?'
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/imoveis/${id}`,
                {
                    method: 'DELETE'
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                'Erro ao excluir imóvel.'
            );

        }


        alert(
            'Imóvel excluído com sucesso!'
        );


        carregarDashboard();


    } catch (erro) {

        console.error(
            'Erro ao excluir imóvel:',
            erro
        );


        alert(
            'Não foi possível excluir o imóvel.'
        );

    }

}


// ====================================================
// CADASTRAR IMÓVEL
// ====================================================

async function cadastrarImovel(evento) {

    evento.preventDefault();


    const formulario =
        document.getElementById('formImovel');


    if (!formulario) {
        return;
    }


    try {

        // --------------------------------------------
        // CRIAR FORM DATA
        // --------------------------------------------

        const dados =
            new FormData();


        // --------------------------------------------
        // CAMPOS DO IMÓVEL
        // --------------------------------------------

        dados.append(
            'titulo',
            document.getElementById('titulo').value
        );


        dados.append(
            'tipo',
            document.getElementById('tipo').value
        );


        dados.append(
            'negocio',
            document.getElementById('negocio').value
        );


        dados.append(
            'preco',
            document.getElementById('preco').value
        );


        dados.append(
            'cidade',
            document.getElementById('cidade').value
        );


        dados.append(
            'bairro',
            document.getElementById('bairro').value
        );


        dados.append(
            'quartos',
            document.getElementById('quartos').value || 0
        );


        dados.append(
            'banheiros',
            document.getElementById('banheiros').value || 0
        );


        dados.append(
            'vagas',
            document.getElementById('vagas').value || 0
        );
         
        dados.append(
                    'descricao',
                    document.getElementById('descricao').value
                );


                // --------------------------------------------
                // DESTAQUE
        // --------------------------------------------

        const destaque =
            document.getElementById('destaque');


        dados.append(
            'destaque',
            destaque && destaque.checked
                ? 'true'
                : 'false'
        );


        // --------------------------------------------
        // FOTOS
        // --------------------------------------------

        const campoFotos =
            document.getElementById('fotos');


        if (
            campoFotos &&
            campoFotos.files
        ) {

            for (
                const arquivo
                of campoFotos.files
            ) {

                dados.append(
                    'fotos',
                    arquivo
                );

            }

        }


        // --------------------------------------------
        // ENVIAR PARA O FLASK
        // --------------------------------------------

        const resposta =
            await fetch(
                `${API_URL}/imoveis`,
                {
                    method: 'POST',
                    body: dados
                }
            );


        const resultado =
            await resposta.json();


        console.log(
            'Resposta do cadastro:',
            resultado
        );


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                'Erro ao cadastrar imóvel.'
            );

        }


        // --------------------------------------------
        // SUCESSO
        // --------------------------------------------

        alert(
            'Imóvel cadastrado com sucesso! 🏠'
        );


        formulario.reset();


        // Voltar para o Dashboard

        window.location.href =
            'dashboard.html';


    } catch (erro) {

        console.error(
            'Erro ao cadastrar imóvel:',
            erro
        );


        alert(
            'Não foi possível cadastrar o imóvel.'
        );

    }

}


/* ====================================================
   ATUALIZAR QUANTIDADE DE LEADS NO DASHBOARD
==================================================== */

async function carregarTotalLeads() {
    const elemento = document.getElementById('totalLeads');

    // Se não estiver no Dashboard, não faz nada.
    if (!elemento) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/leads`);

        if (!resposta.ok) {
            throw new Error('Erro ao consultar os leads.');
        }

        const leads = await resposta.json();

        elemento.textContent = leads.length;

    } catch (erro) {
        console.error('Erro ao carregar total de leads:', erro);
        elemento.textContent = '—';
    }
}



// ====================================================
// INICIAR
// ====================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        // Dashboard

        carregarDashboard();

        // Cadastro


        const formulario =
            document.getElementById(
                'formImovel'
            );


        if (formulario) {

            formulario.addEventListener(
                'submit',
                cadastrarImovel
            );

        }

    }
);
// Dashboard

carregarDashboard();
carregarTotalLeads();