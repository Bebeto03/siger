import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { UserAvailabilityService } from '../../core/services/user-availability.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { AvailabilityBlock, DayOfWeek } from '../../core/models/availability.model';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'Seg' },
  { key: 'TUESDAY', label: 'Ter' },
  { key: 'WEDNESDAY', label: 'Qua' },
  { key: 'THURSDAY', label: 'Qui' },
  { key: 'FRIDAY', label: 'Sex' },
  { key: 'SATURDAY', label: 'Sáb' },
  { key: 'SUNDAY', label: 'Dom' },
];

// 48 rótulos "HH:mm", de 00:00 a 23:30, passo de 30 min
const SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});
const END_OF_DAY = '23:59:59'; // fim de um bloco que inclui o último slot (23:30-23:59:59): LocalTime não aceita 24:00

@Component({
  selector: 'app-disponibilidade',
  standalone: true,
  imports: [ToastComponent],
  styles: [`
    .slot-cell { border-radius: 3px; cursor: pointer; user-select: none; transition: background 0.1s; }
    .slot-cell:hover { outline: 1px solid var(--color-primary); }
    .slot-cell.selected { background: var(--color-primary); }
    .slot-cell.free { background: var(--color-surface-light); }
  `],
  templateUrl: './disponibilidade.html',
})
export class Disponibilidade implements OnInit {
  private availabilityService = inject(UserAvailabilityService);
  readonly notify = inject(NotificationService);

  readonly days = DAYS;
  readonly slots = SLOTS;

  loading = signal(true);
  saving = signal(false);
  grid = signal<boolean[][]>(SLOTS.map(() => DAYS.map(() => false))); // grid()[linha][coluna]

  private dragging = false;
  private paintValue = true;

  async ngOnInit(): Promise<void> {
    try {
      const blocks = await this.availabilityService.buscarMinha();
      this.grid.set(this.blocksToGrid(blocks));
    } catch {
      this.notify.error('Não foi possível carregar sua disponibilidade.');
    } finally {
      this.loading.set(false);
    }
  }

  startDrag(row: number, col: number): void {
    this.paintValue = !this.grid()[row][col];
    this.dragging = true;
    this.paintCell(row, col);
  }

  enterCell(row: number, col: number): void {
    if (this.dragging) this.paintCell(row, col);
  }

  @HostListener('document:mouseup')
  endDrag(): void {
    this.dragging = false;
  }

  async salvar(): Promise<void> {
    this.saving.set(true);
    try {
      const saved = await this.availabilityService.salvarMinha(this.gridToBlocks());
      this.grid.set(this.blocksToGrid(saved));
      this.notify.success('Disponibilidade salva com sucesso!');
    } catch {
      this.notify.error('Erro ao salvar disponibilidade.');
    } finally {
      this.saving.set(false);
    }
  }

  private paintCell(row: number, col: number): void {
    this.grid.update(g => {
      const next = g.map(r => [...r]);
      next[row][col] = this.paintValue;
      return next;
    });
  }

  private blocksToGrid(blocks: AvailabilityBlock[]): boolean[][] {
    const grid = SLOTS.map(() => DAYS.map(() => false));
    for (const b of blocks) {
      const col = DAYS.findIndex(d => d.key === b.dayOfWeek);
      if (col === -1) continue;
      const startIdx = SLOTS.indexOf(b.startTime.slice(0, 5));
      const endIdx = b.endTime.startsWith('23:59') ? SLOTS.length : SLOTS.indexOf(b.endTime.slice(0, 5));
      for (let r = Math.max(startIdx, 0); r < endIdx && r < SLOTS.length; r++) grid[r][col] = true;
    }
    return grid;
  }

  // Mescla linhas marcadas adjacentes de cada coluna em blocos {dayOfWeek, startTime, endTime}
  private gridToBlocks(): AvailabilityBlock[] {
    const g = this.grid();
    const blocks: AvailabilityBlock[] = [];
    for (let col = 0; col < DAYS.length; col++) {
      let runStart: number | null = null;
      for (let row = 0; row <= SLOTS.length; row++) {
        const selected = row < SLOTS.length && g[row][col];
        if (selected && runStart === null) {
          runStart = row;
        } else if (!selected && runStart !== null) {
          blocks.push({
            dayOfWeek: DAYS[col].key,
            startTime: SLOTS[runStart],
            endTime: row === SLOTS.length ? END_OF_DAY : SLOTS[row],
          });
          runStart = null;
        }
      }
    }
    return blocks;
  }
}
