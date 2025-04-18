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
    
    // Gera um número de certificado único baseado no CPF
    function generateCertificateNumber(cpf) {
        // Remove todos os caracteres não numéricos do CPF
        const numericCpf = cpf.replace(/\D/g, '');
        
        // Cria um número de série baseado no CPF e na data atual
        const today = new Date();
        const year = today.getFullYear().toString();
        
        // Usa os últimos 4 dígitos do CPF e adiciona um timestamp parcial
        const lastFourDigits = numericCpf.slice(-4);
        const timestamp = Math.floor(today.getTime() / 1000) % 10000;
        
        // Formata o número do certificado no padrão ANOXXXX-YYYY
        return `${year}${lastFourDigits}-${timestamp.toString().padStart(4, '0')}`;
    }
    
    // Gera datas de emissão e validade para o certificado
    function generateCertificateDates() {
        const today = new Date();
        
        // Formata a data de emissão
        const emissao = formatDate(today);
        
        // Calcula a data de validade (3 anos a partir da emissão)
        const validade = new Date(today);
        validade.setFullYear(validade.getFullYear() + 3);
        
        return {
            dataEmissao: emissao,
            dataValidade: formatDate(validade)
        };
    }
    
    // Formata uma data no padrão DD/MM/YYYY
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
    
    // Determina a região militar com base no CPF
    function getRegiaoMilitar(cpf) {
        // Remove todos os caracteres não numéricos
        const numericCpf = cpf.replace(/\D/g, '');
        
        // Considera os dois primeiros dígitos do CPF para determinar a região
        const firstTwoDigits = parseInt(numericCpf.substring(0, 2), 10);
        
        // Mapeamento de faixas de CPF para regiões militares
        // Baseado em uma distribuição arbitrária para fins de demonstração
        if (firstTwoDigits < 10) return '1'; // 1ª Região Militar (RJ)
        if (firstTwoDigits < 20) return '2'; // 2ª Região Militar (SP)
        if (firstTwoDigits < 30) return '3'; // 3ª Região Militar (RS)
        if (firstTwoDigits < 40) return '4'; // 4ª Região Militar (MG)
        if (firstTwoDigits < 50) return '5'; // 5ª Região Militar (PR, SC)
        if (firstTwoDigits < 60) return '6'; // 6ª Região Militar (BA)
        if (firstTwoDigits < 70) return '7'; // 7ª Região Militar (PE, AL, PB, RN)
        if (firstTwoDigits < 80) return '8'; // 8ª Região Militar (PA, AP, MA)
        if (firstTwoDigits < 90) return '9'; // 9ª Região Militar (MS, MT)
        return '10'; // 10ª Região Militar (CE, PI)
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
                
                // Preencher informações adicionais do certificado
                // Gerar número do certificado baseado no CPF do usuário
                const certNumber = generateCertificateNumber(data.data.cpf);
                document.getElementById('certNumber').textContent = certNumber;
                
                // Gerar datas de emissão e validade
                const { dataEmissao, dataValidade } = generateCertificateDates();
                document.getElementById('dataEmissao').textContent = dataEmissao;
                document.getElementById('dataValidade').textContent = dataValidade;
                
                // Atribuir região militar com base nos primeiros dígitos do CPF
                const regiaoMilitar = getRegiaoMilitar(data.data.cpf);
                document.getElementById('regiaoMilitar').textContent = regiaoMilitar;
                
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
