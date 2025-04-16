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
    // Initialize Cleave.js for CPF formatting
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        new Cleave(cpfInput, {
            delimiters: ['.', '.', '-'],
            blocks: [3, 3, 3, 2],
            numericOnly: true
        });
    }
});
