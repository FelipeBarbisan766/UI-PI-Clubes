import { Pipe, PipeTransform } from '@angular/core';

const LABELS: Record<string, string> = {
  pix: 'Pix',
  visa: 'Cartão Visa',
  master: 'Cartão Mastercard',
  elo: 'Cartão Elo',
  amex: 'Cartão American Express',
  hipercard: 'Cartão Hipercard',
  account_money: 'Saldo Mercado Pago',
  bolbradesco: 'Boleto',
};

@Pipe({ name: 'paymentMethod' })
export class PaymentMethodPipe implements PipeTransform {
  transform(method: string | null | undefined): string {
    if (!method) return 'Aguardando escolha';
    return LABELS[method] ?? method; 
  }
}