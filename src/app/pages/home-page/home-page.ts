import { Component } from '@angular/core';
import { Navbar } from "../../shared/navbar/navbar";

@Component({
  selector: 'app-home-page',
  imports: [Navbar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {}
