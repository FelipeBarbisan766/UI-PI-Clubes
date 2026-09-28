import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[TextDirective]',
})
export class TextDirective {

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    const inputData = event.data;
    
    if (!inputData) return;

    const regexLetras = /^[A-Za-z0-9À-ÿ\s.,!?()]+$/;

    if (!regexLetras.test(inputData)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pasteData = event.clipboardData?.getData('text') || '';
    const regexLetras = /^[A-Za-z0-9À-ÿ\s.,!?()]+$/;

    if (!regexLetras.test(pasteData)) {
      event.preventDefault();
    }
  }
}