import { Component, inject, output } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);

  readonly sidebarToggle = output<void>();
  readonly user = this.authService.user;

  logout(): void {
    this.authService.logout();
  }
}
