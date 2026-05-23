export type TaskStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export interface Task {
  id?: number;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  assignee?: { id: number; name?: string; email?: string };
  meeting: { id: number; title?: string };
  createdAt?: string;
}
