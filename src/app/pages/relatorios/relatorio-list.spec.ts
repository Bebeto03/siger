import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { RelatorioList } from './relatorio-list';
import { Dashboard } from '../dashboard/dashboard';
import { IndicadoresActions, initialState, IndicadoresState } from '../../store/indicadores';
import { Meeting } from '../../core/models/meeting.model';

const hoje = new Date();
const esteMes = (dia: number) =>
  `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}T10:00:00`;

const MEETINGS: Meeting[] = [
  {
    id: 1, title: 'Sprint', description: '', location: 'Sala 1', meetingDate: esteMes(2), duration: 40, status: 'CONCLUIDO',
    participants: [
      { id: 1, role: 'PARTICIPANTE', participation: 'PARTICIPOU',     user: { id: 1 } },
      { id: 2, role: 'PARTICIPANTE', participation: 'NAO_PARTICIPOU', user: { id: 2 } },
    ],
  },
  {
    id: 2, title: 'Review', description: '', location: '', meetingDate: esteMes(28), duration: 60, status: 'NAO_INICIADO',
    participants: [{ id: 3, role: 'PARTICIPANTE', participation: 'TALVEZ', user: { id: 1 } }],
  },
];

const state: { indicadores: IndicadoresState } = {
  indicadores: {
    ...initialState,
    meetings: MEETINGS,
    tasks: [{ id: 1, title: 't', status: 'NAO_INICIADO', meeting: { id: 1 } }],
    attendanceGeneral: 50,
    averageTime: 50,
    loaded: true,
  },
};

describe('Telas de indicadores (RF29)', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioList, Dashboard],
      providers: [provideMockStore({ initialState: state }), provideRouter([]), provideHttpClient()],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'dispatch');
  });

  it('Relatórios dispara o carregamento e renderiza 5 gráficos Chart.js', async () => {
    const fixture = TestBed.createComponent(RelatorioList);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(store.dispatch).toHaveBeenCalledWith(IndicadoresActions.carregar());

    const el = fixture.nativeElement as HTMLElement;
    const charts = el.querySelectorAll('app-chart canvas');
    expect(charts.length).toBe(5);
    expect(el.textContent).toContain('Total de reuniões');
    expect(el.textContent).toContain('50%');       // taxa média de presença (backend)
    expect(el.textContent).toContain('50 min');    // tempo médio (backend)
  });

  it('Relatórios mostra estado vazio quando não há reuniões', () => {
    store.setState({ indicadores: { ...state.indicadores, meetings: [] } });
    const fixture = TestBed.createComponent(RelatorioList);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('app-chart').length).toBe(0);
    expect(el.textContent).toContain('Ainda não há reuniões cadastradas');
  });

  it('Dashboard lê do store: KPIs, gráfico e confirmações pendentes', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('app-chart canvas').length).toBe(1);
    expect(el.textContent).toContain('Reuniões este mês');
    expect(el.textContent).toContain('1 sem resposta'); // reunião 2 tem 1 TALVEZ
    expect(el.textContent).toContain('Review');         // próxima reunião
  });
});
