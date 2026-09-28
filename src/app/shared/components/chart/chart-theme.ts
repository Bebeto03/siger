import { ChartOptions } from 'chart.js';

/**
 * Paleta dos gráficos — passos mais escuros das cores do tema (styles.css),
 * validados para o fundo --color-surface (#111827): contraste >= 3:1 e
 * separação para daltonismo entre pares adjacentes.
 */
export const CHART_SERIES = {
  primary: '#0891B2', // ciano  — série principal
  accent:  '#D97706', // âmbar  — segunda série
  success: '#059669', // verde
  purple:  '#7C3AED', // roxo
  danger:  '#DC2626', // vermelho
} as const;

/** Ordem fixa das séries categóricas (nunca reciclar hue). */
export const CHART_CATEGORICAL: string[] = [
  CHART_SERIES.primary,
  CHART_SERIES.accent,
  CHART_SERIES.success,
  CHART_SERIES.purple,
  CHART_SERIES.danger,
];

/** Cores de status — semânticas, alinhadas aos badges já usados nas telas. */
export const CHART_STATUS = {
  NAO_INICIADO: CHART_SERIES.primary,
  EM_ANDAMENTO: CHART_SERIES.accent,
  CONCLUIDO:    CHART_SERIES.success,
  CANCELADO:    CHART_SERIES.danger,
} as const;

export function withAlpha(hex: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function cssVar(name: string, fallback: string): string {
  if (typeof getComputedStyle === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Tokens de texto/superfície lidos das CSS vars do tema em tempo de execução. */
export function chartInk() {
  return {
    text:      cssVar('--color-text-secondary', '#94A3B8'),
    muted:     cssVar('--color-text-muted', '#64748B'),
    grid:      cssVar('--color-border', '#2D3B4F'),
    surface:   cssVar('--color-surface', '#111827'),
    tooltipBg: cssVar('--color-surface-light', '#1F2937'),
    heading:   cssVar('--color-text-primary', '#F1F5F9'),
  };
}

/** Opções base compartilhadas: grade recessiva, tooltip do tema, legenda discreta. */
export function baseChartOptions(): ChartOptions {
  const ink = chartInk();
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: ink.text,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 16,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: ink.tooltipBg,
        titleColor: ink.heading,
        bodyColor: ink.text,
        borderColor: ink.grid,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: ink.grid },
        ticks: { color: ink.muted, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: withAlpha(ink.grid, 0.6) },
        border: { display: false },
        ticks: { color: ink.muted, font: { size: 11 }, precision: 0 },
      },
    },
  };
}
