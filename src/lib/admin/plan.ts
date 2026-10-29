/* Job-search plan: loading and the form actions used by Resumen and Plan. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, PlanPhaseRow, PlanTaskRow } from '../database.types';
import { SAVE_FAILED, nextSortOrder, text } from './forms';

type Client = SupabaseClient<Database>;

export interface Phase extends PlanPhaseRow {
  tasks: PlanTaskRow[];
  done: number;
  total: number;
  pct: number;
}

export interface Plan {
  phases: Phase[];
  done: number;
  total: number;
  pct: number;
}

const percent = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export async function loadPlan(supabase: Client): Promise<Plan> {
  const [phasesRes, tasksRes] = await Promise.all([
    supabase.from('plan_phases').select('*').order('sort_order').order('updated_at'),
    supabase.from('plan_tasks').select('*').order('sort_order'),
  ]);
  if (phasesRes.error) throw phasesRes.error;
  if (tasksRes.error) throw tasksRes.error;

  const phases = phasesRes.data.map((phase) => {
    const tasks = tasksRes.data.filter((t) => t.phase_id === phase.id);
    const done = tasks.filter((t) => t.done).length;
    return { ...phase, tasks, done, total: tasks.length, pct: percent(done, tasks.length) };
  });
  const done = phases.reduce((n, p) => n + p.done, 0);
  const total = phases.reduce((n, p) => n + p.total, 0);
  return { phases, done, total, pct: percent(done, total) };
}

/** Runs the plan action named by the form's `intent`. Returns an error message or null. */
export async function handlePlanAction(supabase: Client, form: FormData): Promise<string | null> {
  const intent = text(form, 'intent');
  const id = text(form, 'id');
  let error: { message: string } | null = null;

  switch (intent) {
    case 'toggle-task':
      ({ error } = await supabase.from('plan_tasks').update({ done: text(form, 'done') === 'true' }).eq('id', id));
      break;
    case 'delete-task':
      ({ error } = await supabase.from('plan_tasks').delete().eq('id', id));
      break;
    case 'add-task': {
      const value = text(form, 'text');
      if (!value) return 'Escribe la tarea.';
      const { data } = await supabase.from('plan_tasks').select('sort_order').eq('phase_id', id);
      ({ error } = await supabase
        .from('plan_tasks')
        .insert({ phase_id: id, text: value, sort_order: nextSortOrder(data ?? []) }));
      break;
    }
    case 'toggle-phase':
      ({ error } = await supabase.from('plan_phases').update({ open: text(form, 'open') === 'true' }).eq('id', id));
      break;
    case 'delete-phase':
      ({ error } = await supabase.from('plan_phases').delete().eq('id', id));
      break;
    case 'add-phase': {
      const name = text(form, 'name');
      if (!name) return 'Escribe el nombre de la fase.';
      const { data } = await supabase.from('plan_phases').select('sort_order');
      ({ error } = await supabase.from('plan_phases').insert({ name, sort_order: nextSortOrder(data ?? []) }));
      break;
    }
    default:
      return 'Acción desconocida.';
  }
  if (error) console.error('Plan action failed:', intent, error.message);
  return error ? SAVE_FAILED : null;
}
