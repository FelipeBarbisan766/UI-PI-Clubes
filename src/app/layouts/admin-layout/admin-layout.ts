import { Component } from '@angular/core';
import { SearchHome } from "../../shared/components/search-home/search-home";

@Component({
  selector: 'app-admin-layout',
  imports: [SearchHome],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {}
