/**
 * TaskList component - Renders the task tree
 */
import React from 'react'
import type { Task } from './types.js'
import { TaskItem } from './TaskItem'

type TaskListProps = {
  tasks: Task[]
  onToggleComplete: (taskId: string, completed: boolean) => void
  onAddSubtask: (parentId: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onAddTask: () => void
  loading?: boolean
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleComplete,
  onAddSubtask,
  onEdit,
  onDelete,
  onAddTask,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div 
        onClick={onAddTask}
        className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-500 dark:hover:text-gray-400 transition-all group"
      >
        <p className="text-xl font-medium group-hover:scale-105 transition-transform">Click here to create your first task</p>
      </div>
    )
  }

  return (
    <div className="task-list space-y-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onAddSubtask={onAddSubtask}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      <div 
        onClick={onAddTask}
        className="py-3 px-2 text-transparent hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer transition-colors mt-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 group h-10"
      >
        <span className="text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity">+</span> 
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Click here to add a task</span>
      </div>
    </div>
  )
}

