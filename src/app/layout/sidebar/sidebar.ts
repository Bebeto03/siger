import { Component, inject, input, output } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: 'sidebar.html'
})
export class AppSidebar {
  readonly auth = inject(AuthService);
  private router = inject(Router);

  collapsed = input(false);
  toggleCollapse = output<void>();

  readonly navItems: NavItem[] = [
    { id: 'dashboard',     label: 'Dashboard',    icon: '🏠', route: '/dashboard'     },
    { id: 'reunioes',      label: 'Reuniões',      icon: '📅', route: '/reunioes'      },
    { id: 'tarefas',       label: 'Tarefas',       icon: '✅', route: '/tarefas'       },
    { id: 'atas',          label: 'Atas',           icon: '📋', route: '/atas'          },
    { id: 'relatorios',    label: 'Relatórios',    icon: '📊', route: '/relatorios'    },
    { id: 'usuarios',      label: 'Usuários',      icon: '👥', route: '/usuarios',      adminOnly: true },
    { id: 'configuracoes', label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
  ];

  navigate(route: string): void { this.router.navigate([route]); }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  initials(): string {
    const name = this.auth.getNomeUsuario();
    return name ? name.substring(0, 2).toUpperCase() : 'US';
  }

  roleLabel(): string {
    const authorities = this.auth.currentUser()?.authorities ?? [];
    if (authorities.some(a => a.includes('ADMIN')))        return 'Administrador';
    if (authorities.some(a => a.includes('ORGANIZADOR')))  return 'Organizador';
    return 'Participante';
  }

  onHover(event: MouseEvent, route: string, enter: boolean): void {
    if (!this.isActive(route)) {
      (event.currentTarget as HTMLElement).style.background = enter
        ? 'var(--color-surface-hover)' : 'transparent';
    }
  }
}
