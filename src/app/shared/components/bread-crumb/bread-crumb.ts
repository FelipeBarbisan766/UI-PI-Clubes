import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreadcrumbService } from './bread-crumb-service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bread-crumb.html',
    
})
export class BreadCrumb {
  breadcrumbs$ = inject(BreadcrumbService).breadcrumbs$;
}