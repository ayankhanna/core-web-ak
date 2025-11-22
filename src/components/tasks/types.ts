/**
 * Task types
 */

export interface Task {
  id: string
  user_id: string
  title: string
  notes?: string | null
  due_date?: string | null
  completed: boolean
  parent_id?: string | null
  position: number
  level: number
  created_at: string
  updated_at: string
  children?: Task[]
}

export interface TaskFormData {
  title: string
  notes?: string
  due_date?: string
  parent_id?: string
  position?: number
}
