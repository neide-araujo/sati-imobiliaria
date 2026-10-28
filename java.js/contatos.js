const API_URL = 'http://127.0.0.1:5000';

document.addEventListener('DOMContentLoaded', () => {
    const mensagemSucesso = document.getElementById('mensagemSucesso');
    const formulario = document.getElementById('formContato');

    if (!formulario) return;

    formulario.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const interesse = document.getElementById('interesse').value;
        const mensagem = document.getElementById('mensagem').value.trim();

        try {
            const resposta = await fetch(`${API_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome,
                    email,
                    telefone,
                    interesse,
                    mensagem
                })
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                throw new Error(resultado.erro || 'Não foi possível enviar a mensagem.');
            }

            if (mensagemSucesso) {
                mensagemSucesso.textContent = 'Mensagem enviada com sucesso!';
                mensagemSucesso.style.display = 'block';
            }

            formulario.reset();

        } catch (erro) {
            console.error('Erro ao enviar contato:', erro);
            alert('Não foi possível enviar sua mensagem. Tente novamente.');
        }
    });
});
