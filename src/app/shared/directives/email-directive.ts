import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[EmailDirective]',
})
export class EmailDirective {

  private readonly allowedCharsRegex = /^[a-zA-Z0-9._%+\-@]$/;

  private readonly fullEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    const inputData = event.data;

    if (!inputData) return;

    for (const char of inputData) {
      if (!this.allowedCharsRegex.test(char)) {
        event.preventDefault();
        return;
      }
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pasteData = event.clipboardData?.getData('text') || '';

    if (!this.fullEmailRegex.test(pasteData.trim())) {
      event.preventDefault();
    }
  }
}
