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
        return date.toLocaleDateString('pt-BR');
    }
    
    // Helper function to format time
    function formatTime(date) {
        return date.toLocaleTimeString('pt-BR');
    }
    
    // Helper function to generate protocol number
    function generateProtocol(cpf, name) {
        const now = new Date();
        const protocolBase = cpf.slice(0, 5);
        const hashValue = Math.abs(hashCode(cpf + name));
        const sequential = String(hashValue % 10000).padStart(4, '0');
        return `CAC-${protocolBase}-${sequential}/${now.getFullYear()}`;
    }
    
    // Helper function to calculate hash code
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
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
    
    // Function to handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
        
        try {
            const response = await fetch('/api/verify-cpf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cpf }),
            });
            
            const data = await response.json();
            
            if (data.status === 'approved') {
                // Fill user data
                document.getElementById('resultCpf').textContent = data.data.cpf;
                document.getElementById('resultNome').textContent = data.data.nome;
                document.getElementById('resultNomeMae').textContent = data.data.nomeMae;
                document.getElementById('resultDataNascimento').textContent = data.data.dataNascimento;
                document.getElementById('resultSexo').textContent = data.data.sexo;
                
                // Generate certificate number
                const now = new Date();
                const protocol = generateProtocol(cpf, data.data.nome);
                
                document.getElementById('certNumber').textContent = protocol;
                document.getElementById('dataEmissao').textContent = formatDate(now);
                document.getElementById('dataValidade').textContent = formatDate(new Date(now.setFullYear(now.getFullYear() + 5)));
                document.getElementById('regiaoMilitar').textContent = '1';
                
                // Show certificate
                document.getElementById('consultaForm').classList.add('hidden');
                document.getElementById('certificadoAprovado').classList.remove('hidden');
            } else {
                alert(data.message || 'Erro ao verificar CPF');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao processar sua solicitação. Por favor, tente novamente.');
        }
    }
    
    // Add event listeners when DOM is loaded
    if (cpfForm) {
        cpfForm.addEventListener('submit', handleFormSubmit);
    }
});
