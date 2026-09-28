import { createFeature, createReducer, on } from '@ngrx/store';
import { Meeting } from '../../core/models/meeting.model';
import { Task } from '../../core/models/task.model';
import { IndicadoresActions } from './indicadores.actions';

export interface IndicadoresState {
  meetings: Meeting[];
  tasks: Task[];
  attendanceGeneral: number | null;
  averageTime: number | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialState: IndicadoresState = {
  meetings: [],
  tasks: [],
  attendanceGeneral: null,
  averageTime: null,
  loading: false,
  loaded: false,
  error: null,
};

export const indicadoresFeature = createFeature({
  name: 'indicadores',
  reducer: createReducer(
    initialState,
    on(IndicadoresActions.carregar, state => ({ ...state, loading: true, error: null })),
    on(IndicadoresActions.carregarSucesso, (state, { meetings, tasks, attendanceGeneral, averageTime }) => ({
      ...state,
      meetings,
      tasks,
      attendanceGeneral,
      averageTime,
      loading: false,
      loaded: true,
    })),
    on(IndicadoresActions.carregarFalha, (state, { error }) => ({
      ...state,
      loading: false,
      loaded: true,
      error,
    })),
  ),
});

export const {
  name: indicadoresFeatureKey,
  reducer: indicadoresReducer,
  selectIndicadoresState,
  selectMeetings,
  selectTasks,
  selectAttendanceGeneral,
  selectAverageTime,
  selectLoading,
  selectLoaded,
  selectError,
} = indicadoresFeature;
