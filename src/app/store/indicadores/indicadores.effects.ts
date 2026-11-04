import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, forkJoin, from, map, of, switchMap } from 'rxjs';
import { Meeting } from '../../core/models/meeting.model';
import { MeetingService } from '../../core/services/meeting.service';
import { TaskService } from '../../core/services/task.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { IndicadoresActions } from './indicadores.actions';
import { ParticipantService } from '../../core/services/participant.service';


const sanitize = (v: number | null): number | null => (v != null && isFinite(v) ? v : null);

@Injectable()
export class IndicadoresEffects {
  private actions$         = inject(Actions);
  private meetingService   = inject(MeetingService);
  private participantService   = inject(ParticipantService);
  private taskService      = inject(TaskService);
  private dashboardService = inject(DashboardService);

  private carregarReunioes() {
    return from(this.meetingService.listarMinhasReunioes()).pipe(
      switchMap(meetings =>
        // forkJoin([]) completa sem emitir: trata a lista vazia à parte
        meetings.length === 0
          ? of([] as Meeting[])
          : forkJoin(
              meetings.map(m =>
                m.id == null
                  ? of({ ...m, participants: [] })
                  : from(this.participantService.listarPorReuniao(m.id)).pipe(
                      map(participants => ({ ...m, participants })),
                      catchError(() => of({ ...m, participants: [] })),
                    ),
              ),
            ),
      ),
    );
  }

  carregar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IndicadoresActions.carregar),
      exhaustMap(() =>
        forkJoin({
          meetings: this.carregarReunioes(),
          tasks: from(this.taskService.listarPorReuniaoPorUsuario()).pipe(catchError(() => of([]))),
          attendanceGeneral: from(this.dashboardService.attendanceGeneral()).pipe(catchError(() => of(null))),
          averageTime: from(this.dashboardService.averageTime()).pipe(catchError(() => of(null))),
        }).pipe(
          map(r =>
            IndicadoresActions.carregarSucesso({
              meetings: r.meetings,
              tasks: r.tasks,
              attendanceGeneral: sanitize(r.attendanceGeneral),
              averageTime: sanitize(r.averageTime),
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
