import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function isValidCpf(rawValue: string): boolean {
  const cpf = rawValue.replace(/\D/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 111.111.111-11 etc.

  const digits = cpf.split('').map(Number);

  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstCheckDigit = calcCheckDigit(9);
  const secondCheckDigit = calcCheckDigit(10);

  return firstCheckDigit === digits[9] && secondCheckDigit === digits[10];
}

export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; // deixa o `required` cuidar do vazio
    return isValidCpf(control.value) ? null : { cpfInvalid: true };
  };
}

export function notFutureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate > today ? { futureDate: true } : null;
  };
}