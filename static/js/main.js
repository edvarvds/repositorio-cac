document.addEventListener('DOMContentLoaded', function() {
    // Log para verificar que o script está sendo carregado
    console.log('Script main.js carregado');
    
    const cpfForm = document.getElementById('cpfForm');
    const consultaForm = document.getElementById('consultaForm');
    const certificadoAprovado = document.getElementById('certificadoAprovado');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 hidden';
    
    // Add error message element to the form
    cpfForm.appendChild(errorMessage);
    
    // Função para formatar corretamente a data
    function formatarDataNascimento(dataString) {
        // Se a data contém " 00:00:00" (formato que vem da API externa)
        if (dataString && dataString.includes('00:00:00')) {
            return dataString.replace(' 00:00:00', '');
        }
        return dataString;
    }
    
    cpfForm.addEventListener('submit', function(e) {
        // Log para verificar que o evento submit está sendo capturado
        console.log('Formulário submetido');
        e.preventDefault();
        
        const cpfInput = document.getElementById('cpf');
        const cpfValue = cpfInput.value;
        console.log('CPF informado:', cpfValue);
        
        // Clear previous error messages
        errorMessage.innerHTML = '';
        errorMessage.classList.add('hidden');
        
        // Validate CPF format
        if (!isValidCPF(cpfValue)) {
            console.log('CPF inválido');
            errorMessage.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>CPF inválido. Por favor, digite um CPF válido.';
            errorMessage.classList.remove('hidden');
            return;
        }
        
        // Show loading state
        const submitButton = cpfForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
        
        // Make API call to verify CPF
        console.log('Enviando requisição para a API');
        fetch('/api/verify-cpf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cpf: cpfValue }),
        })
        .then(response => {
            console.log('Resposta recebida:', response);
            if (!response.ok) {
                throw new Error('Erro na resposta da API: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Log para verificar os dados retornados
            console.log('Dados recebidos:', data);
            
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            
            if (data.status === 'approved') {
                // Fill in the certificate data
                document.getElementById('resultCpf').textContent = data.data.cpf;
                document.getElementById('resultNome').textContent = data.data.nome;
                document.getElementById('resultNomeMae').textContent = data.data.nomeMae;
                document.getElementById('resultDataNascimento').textContent = formatarDataNascimento(data.data.dataNascimento);
                document.getElementById('resultSexo').textContent = data.data.sexo;
                
                // Create congratulatory message with the person's first name
                const firstName = data.data.nome.split(' ')[0];
                document.getElementById('parabensMensagem').textContent = 
                    `Parabéns, ${firstName}! Seu certificado de Colecionador, Atirador Desportivo e Caçador (CAC) foi aprovado.`;
                
                // Hide the form and show the certificate
                consultaForm.classList.add('hidden');
                certificadoAprovado.classList.remove('hidden');
                
                // Track successful verification with TikTok Pixel
                if (window.ttq) {
                    console.log('Enviando evento para TikTok Pixel');
                    ttq.track('CompleteRegistration', {
                        content_name: 'CAC Certificate Verification',
                        status: 'approved'
                    });
                }
                
                // Smooth scroll to certificate
                certificadoAprovado.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.log('CPF não encontrado');
                // Show error message
                errorMessage.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${data.message}`;
                errorMessage.classList.remove('hidden');
                
                // Track failed verification with TikTok Pixel
                if (window.ttq) {
                    ttq.track('Search', {
                        content_name: 'CAC Certificate Verification',
                        status: 'not_found'
                    });
                }
            }
        })
        .catch(error => {
            console.error('Erro ao processar a solicitação:', error);
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            errorMessage.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Erro ao processar a solicitação. Por favor, tente novamente mais tarde.';
            errorMessage.classList.remove('hidden');
        });
    });
});
