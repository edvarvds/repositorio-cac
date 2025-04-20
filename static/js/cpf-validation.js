// CPF validation functions for Brazilian ID
function isValidCPF(cpf) {
    // Remove non-numeric characters
    cpf = cpf.replace(/\D/g, '');
    
    // Check if it has 11 digits
    if (cpf.length !== 11) {
        return false;
    }
    
    // Check if all digits are the same
    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }
    
    // Validates the first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let checkDigit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cpf.charAt(9)) !== checkDigit1) {
        return false;
    }
    
    // Validates the second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let checkDigit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cpf.charAt(10)) === checkDigit2;
}

// Format the CPF as it's typed
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Cleave for CPF input
    new Cleave('#cpf', {
        numericOnly: true,
        blocks: [3, 3, 3, 2],
        delimiters: ['.', '.', '-']
    });

    // Add input validation
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', function() {
        const value = this.value.replace(/\D/g, '');
        if (value.length > 11) {
            this.value = this.value.slice(0, 14); // 11 digits + 3 delimiters
        }
    });

    // Add form validation
    const form = document.getElementById('cpfForm');
    form.addEventListener('submit', function(e) {
        const cpf = cpfInput.value.replace(/\D/g, '');
        if (cpf.length !== 11) {
            e.preventDefault();
            alert('Por favor, informe um CPF válido com 11 dígitos.');
            return;
        }
    });
});
