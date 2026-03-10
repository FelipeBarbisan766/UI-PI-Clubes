import { Component } from '@angular/core';
import { SearchHome } from "../../shared/components/search-home/search-home";

@Component({
  selector: 'app-home-page',
  imports: [SearchHome],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {}
