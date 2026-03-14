import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import 'cally';

@Component({
  selector: 'app-search-home',
  imports: [],
  templateUrl: './search-home.html',
  styleUrl: './search-home.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SearchHome {
  selectedDate = signal<string>('Quando?');

  onDateChange(event: any) {
    this.selectedDate.set(event.target.value);
    
    const popover = document.getElementById('cally-popover1');
    if (popover) {
      (popover as any).hidePopover(); 
    }
  }
}
