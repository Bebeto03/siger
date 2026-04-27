import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingMinutesService } from '../../core/services/meeting-minutes.service';
import { MeetingService } from '../../core/services/meeting.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { MeetingMinutes } from '../../core/models/meeting-minutes.model';
import { Meeting } from '../../core/models/meeting.model';

interface AtaDisplay {
  minutes: MeetingMinutes;
  meeting?: Meeting;
}

@Component({
  selector: 'app-ata-list',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  styles: [`
    .ata-card { transition: border-color 0.15s, box-shadow 0.15s; cursor: pointer; }
    .ata-card:hover { border-color: var(--color-primary) !important; box-shadow: 0 0 0 1px rgba(6,182,212,0.15); }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  templateUrl: './ata.html'
})
export class AtaList implements OnInit {
  private minutesService = inject(MeetingMinutesService);
  private meetingService = inject(MeetingService);
  private notify         = inject(NotificationService);
  private router         = inject(Router);

  atas     = signal<AtaDisplay[]>([]);
  loading  = signal(false);
  searchText = signal('');

  filtered = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return this.atas();
    return this.atas().filter(a =>
      a.meeting?.title?.toLowerCase().includes(q) ||
      a.minutes.objectives?.toLowerCase().includes(q) ||
      a.minutes.decision?.toLowerCase().includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [minutes, meetings] = await Promise.all([
        this.minutesService.listar(),
        this.meetingService.listar().catch(() => [] as Meeting[]),
      ]);
      this.atas.set(
        minutes.map(m => ({
          minutes: m,
          meeting: meetings.find(mt => mt.id === m.meeting.id),
        }))
      );
    } catch {
      this.notify.error('Erro ao carregar atas.');
    } finally {
      this.loading.set(false);
    }
  }

  goToMeeting(meetingId: number): void {
    this.router.navigate(['/reunioes', meetingId], { fragment: 'minutes' });
  }

  formatDate(dateStr: string): string {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída' };
    return m[s] ?? s;
  }

  statusColor(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'var(--color-primary)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDO: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  statusBg(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'rgba(6,182,212,0.15)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDO: 'rgba(16,185,129,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }
}
