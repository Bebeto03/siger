import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, forkJoin, from, map, of } from 'rxjs';
import { MeetingService } from '../../core/services/meeting.service';
import { TaskService } from '../../core/services/task.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { IndicadoresActions } from './indicadores.actions';

const sanitize = (v: number | null): number | null => (v != null && isFinite(v) ? v : null);

@Injectable()
export class IndicadoresEffects {
  private actions$         = inject(Actions);
  private meetingService   = inject(MeetingService);
  private taskService      = inject(TaskService);
  private dashboardService = inject(DashboardService);

  carregar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IndicadoresActions.carregar),
      exhaustMap(() =>
        forkJoin({
          meetings:          from(this.meetingService.listarMinhasReunioes()),
          // tarefas e KPIs do backend degradam para vazio/null sem derrubar a carga
          tasks:             from(this.taskService.listar()).pipe(catchError(() => of([]))),
          attendanceGeneral: from(this.dashboardService.attendanceGeneral()),
          averageTime:       from(this.dashboardService.averageTime()),
        }).pipe(
          map(r =>
            IndicadoresActions.carregarSucesso({
              meetings:          r.meetings,
              tasks:             r.tasks,
              attendanceGeneral: sanitize(r.attendanceGeneral),
              averageTime:       sanitize(r.averageTime),
            }),
          ),
          catchError(err =>
            of(IndicadoresActions.carregarFalha({ error: err?.message ?? 'Falha ao carregar indicadores' })),
          ),
        ),
      ),
    ),
  );
}
