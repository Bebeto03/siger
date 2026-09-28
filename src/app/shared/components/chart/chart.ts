import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  ChartOptions,
  ChartType,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { baseChartOptions } from './chart-theme';

// Registro seletivo (tree-shaking): só os módulos que o SIGER usa.
Chart.register(
  BarController, LineController, DoughnutController,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
);

/**
 * Wrapper standalone do Chart.js.
 *
 * Uso: <app-chart type="bar" [data]="dados()" [options]="opcoes" [height]="220" />
 *
 * - `data` é reativo: quando o signal de origem muda, o gráfico é atualizado in-place.
 * - `options` são mescladas sobre `baseChartOptions()` (tema, tooltip, grade recessiva).
 * - A instância é destruída no `ngOnDestroy` para não vazar canvas/listeners.
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `
    <div class="chart-host" [style.height.px]="height()">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .chart-host { position: relative; width: 100%; }
  `],
})
export class ChartComponent implements OnDestroy {
  type      = input.required<ChartType>();
  data      = input.required<ChartData>();
  options   = input<ChartOptions>({});
  height    = input<number>(220);
  ariaLabel = input<string>('Gráfico');

  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    afterNextRender(() => this.build());

    // Atualiza os dados sem recriar o gráfico (mantém animação e estado de hover).
    effect(() => {
      const data = this.data();
      const chart = untracked(() => this.chart);
      if (!chart) return;
      chart.data = data;
      chart.update();
    });
  }

  private build(): void {
    const ctx = this.canvas().nativeElement.getContext('2d');
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: this.type(),
      data: this.data(),
      options: mergeOptions(baseChartOptions(), this.options()),
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}

/** Merge raso por nível (plugins/scales) — suficiente para sobrescrever pontos específicos. */
function mergeOptions(base: ChartOptions, extra: ChartOptions): ChartOptions {
  const out: any = { ...base, ...extra };
  if (base.plugins || extra.plugins) {
    out.plugins = { ...base.plugins };
    for (const [k, v] of Object.entries(extra.plugins ?? {})) {
      out.plugins[k] = { ...(base.plugins as any)?.[k], ...(v as object) };
    }
  }
  if (base.scales || extra.scales) {
    out.scales = { ...base.scales };
    for (const [k, v] of Object.entries(extra.scales ?? {})) {
      out.scales[k] = { ...(base.scales as any)?.[k], ...(v as object) };
    }
  }
  return out;
}
