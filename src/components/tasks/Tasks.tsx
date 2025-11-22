/**
 * Tasks component - Main task management view
 */
import React, { useState, useEffect } from 'react'
import type { Task, TaskFormData } from './types.js'
import { TaskList } from './TaskList'
import { TaskForm } from './TaskForm'
import {
  getTaskTree,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
} from '../../lib/api-client'

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null)
  const [includeCompleted, setIncludeCompleted] = useState(true)

  // Load tasks
  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await getTaskTree(includeCompleted)
      setTasks(response.tasks || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [includeCompleted])

  // Handle create/update task
  const handleSubmitTask = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, data)
      } else {
        // Create new task
        await createTask(data)
      }

      // Reload tasks
      await loadTasks()

      // Close form
      setShowForm(false)
      setEditingTask(null)
      setParentIdForNew(null)
    } catch (error) {
      console.error('Error saving task:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save task'
      )
    }
  }

  // Handle toggle completion
  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await toggleTaskCompletion(taskId, completed)
      await loadTasks()
    } catch (error) {
      console.error('Error toggling task completion:', error)
    }
  }

  // Handle add subtask
  const handleAddSubtask = (parentId: string) => {
    setParentIdForNew(parentId)
    setEditingTask(null)
    setShowForm(true)
  }

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setParentIdForNew(null)
    setShowForm(true)
  }

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this task? All subtasks will also be deleted.'
      )
    ) {
      return
    }

    try {
      await deleteTask(taskId)
      await loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task')
    }
  }

  // Handle cancel form
  const handleCancelForm = () => {
    setShowForm(false)
    setEditingTask(null)
    setParentIdForNew(null)
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Tasks
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show completed
          </label>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onAddSubtask={handleAddSubtask}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onAddTask={() => {
            setEditingTask(null)
            setParentIdForNew(null)
            setShowForm(true)
          }}
          loading={loading}
        />
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          parentId={parentIdForNew}
          onSubmit={handleSubmitTask}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  )
}

