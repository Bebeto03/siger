import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Meeting } from '../../core/models/meeting.model';
import { Task } from '../../core/models/task.model';

export interface IndicadoresPayload {
  meetings: Meeting[];
  tasks: Task[];
  attendanceGeneral: number | null;
  averageTime: number | null;
}

export const IndicadoresActions = createActionGroup({
  source: 'Indicadores',
  events: {
    'Carregar': emptyProps(),
    'Carregar Sucesso': props<IndicadoresPayload>(),
    'Carregar Falha': props<{ error: string }>(),
  },
});
