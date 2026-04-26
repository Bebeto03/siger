export type TaskStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export interface Task {
  id?: number;
  title: string;
  status: TaskStatus;
  dueDate?: string;
  assignee?: { id: number; name?: string; email?: string };
  meeting: { id: number; title?: string };
  createdAt?: string;
}
