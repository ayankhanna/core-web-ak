/**
 * TaskItem component - Individual task with hover actions
 */
import React, { useState } from 'react'
import type { Task } from './types.js'
import { formatDistance } from 'date-fns'

type TaskItemProps = {
  task: Task
  onToggleComplete: (taskId: string, completed: boolean) => void
  onAddSubtask: (parentId: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  level?: number
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onAddSubtask,
  onEdit,
  onDelete,
  level = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showChildren, setShowChildren] = useState(true)

  const hasChildren = task.children && task.children.length > 0
  const canAddSubtask = task.level < 4 // Max 5 levels (0-4)
  
  // Auto-expand if we have no children so the "Add subtask" button is visible? 
  // No, let's keep it collapsed by default if empty to reduce noise, 
  // UNLESS it's a root level task which we might want to encourage adding to?
  // User asked for "click directly onto the canvas", suggesting visible targets.
  // Let's rely on the user expanding empty tasks if they want to add subtasks, 
  // OR make the expand button always visible/clickable even if empty (which we did).

  const formatDueDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return formatDistance(date, new Date(), { addSuffix: true })
    } catch {
      return null
    }
  }

  const dueDateDisplay = formatDueDate(task.due_date)
  const isPastDue =
    task.due_date && new Date(task.due_date) < new Date() && !task.completed

  return (
    <div className="task-item">
      <div
        className={`task-content group flex items-center gap-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all ${
          task.completed ? 'opacity-60' : ''
        } ${
          level === 0 
            ? 'py-3 px-4 mb-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700' 
            : 'py-2 px-2'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse Button - Modified logic to show even if no children so we can add them */}
        <button
          onClick={() => setShowChildren(!showChildren)}
          className={`text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors ${level === 0 ? 'mt-0.5' : ''} ${!hasChildren && !showChildren ? 'invisible group-hover:visible' : ''}`}
        >
          <svg
            className={`w-4 h-4 transform transition-transform ${showChildren ? 'rotate-0' : '-rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onToggleComplete(task.id, e.target.checked)}
          className={`text-blue-600 bg-gray-50 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer transition-all ${
            level === 0 ? 'w-5 h-5' : 'w-4 h-4'
          }`}
        />

        {/* Task Title */}
        <div className="flex-1 min-w-0">
          <div
            className={`${
              task.completed
                ? 'line-through text-gray-500 dark:text-gray-400'
                : 'text-gray-900 dark:text-gray-100'
            } ${
              level === 0 ? 'text-lg font-semibold' : 'text-sm font-medium'
            }`}
          >
            {task.title}
          </div>
          {task.notes && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {task.notes}
            </div>
          )}
        </div>

        {/* Due Date */}
        {dueDateDisplay && (
          <div
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isPastDue
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {dueDateDisplay}
          </div>
        )}

        {/* Action Buttons (shown on hover) */}
        <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {canAddSubtask && (
            <button
              onClick={() => onAddSubtask(task.id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Add subtask"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Edit task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Delete task"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Render Children */}
      {showChildren && (
        <div className={`task-children mt-1 ${level === 0 ? 'pl-8' : 'pl-6'}`}>
          {task.children?.map((child) => (
            <TaskItem
              key={child.id}
              task={child}
              onToggleComplete={onToggleComplete}
              onAddSubtask={onAddSubtask}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
          {/* Inline Add Subtask Button */}
          {canAddSubtask && (
             <div 
               onClick={() => onAddSubtask(task.id)}
               className="py-2 px-2 text-transparent hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer transition-colors flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group h-8"
             >
               <span className="text-lg leading-none opacity-0 group-hover:opacity-100 transition-opacity">+</span> 
               <span className="opacity-0 group-hover:opacity-100 transition-opacity">Add subtask</span>
             </div>
          )}
        </div>
      )}
    </div>
  )
}

