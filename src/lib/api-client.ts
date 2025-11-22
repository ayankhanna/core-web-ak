/**
 * API Client for communicating with core-api backend
 */
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the Supabase JWT from current session, refreshing if needed
 */
async function getSupabaseToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting Supabase token:', error)
    return null
  }
}

/**
 * Authenticated fetch wrapper that handles token refreshing
 */
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = await getSupabaseToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }

  let response = await fetch(url, { ...options, headers })

  // If 401, try to refresh session one more time
  if (response.status === 401) {
    console.log('🔄 Token expired, attempting refresh...')
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (!error && session) {
      token = session.access_token
      const newHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        'Authorization': `Bearer ${token}`
  }
      response = await fetch(url, { ...options, headers: newHeaders })
    }
  }

  return response
}

// ============================================================================
// Types
// ============================================================================

type OAuthConnectionData = {
  user_id: string
  email: string
  name?: string
  avatar_url?: string
  provider: string
  provider_user_id: string
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  scopes: string[]
  metadata?: Record<string, any>
}

type CalendarEvent = {
  id?: string
  user_id?: string
  title: string
  description?: string | null
  location?: string | null
  start_time: string
  end_time: string
  is_all_day?: boolean
  status?: string
  created_at?: string
  updated_at?: string
}

// ============================================================================
// Auth Endpoints
// ============================================================================

/**
 * Complete OAuth flow by creating user and storing tokens
 */
export async function completeOAuthFlow(data: OAuthConnectionData) {
  const response = await authFetch(`${API_BASE_URL}/auth/complete-oauth`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to complete OAuth flow')
  }

  return response.json()
}

// ============================================================================
// Calendar Endpoints
// ============================================================================

/**
 * Get today's calendar events for a user
 */
export async function getTodayEvents(userId: string) {
  const params = new URLSearchParams({
    user_id: userId,
  })

  const response = await authFetch(`${API_BASE_URL}/api/calendar/events/today?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch today\'s events')
  }

  return response.json()
}

/**
 * Get all calendar events for a user
 */
export async function getAllEvents(userId: string) {
  const params = new URLSearchParams({
    user_id: userId,
  })

  const response = await authFetch(`${API_BASE_URL}/api/calendar/events?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events')
  }

  return response.json()
}

/**
 * Sync calendar events from Google Calendar
 */
export async function syncGoogleCalendar(userId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(`${API_BASE_URL}/api/calendar/sync?${params}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to sync calendar')
  }

  return response.json()
}

/**
 * Create a new calendar event
 */
export async function createEvent(userId: string, eventData: Partial<CalendarEvent>) {
  const params = new URLSearchParams({ user_id: userId })
  
  const response = await authFetch(`${API_BASE_URL}/api/calendar/events?${params}`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create event')
  }

  return response.json()
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(userId: string, eventId: string, eventData: Partial<CalendarEvent>) {
  const params = new URLSearchParams({ user_id: userId })
  
  const response = await authFetch(`${API_BASE_URL}/api/calendar/events/${eventId}?${params}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update event')
  }

  return response.json()
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(userId: string, eventId: string) {
  const params = new URLSearchParams({ user_id: userId })
  
  const response = await authFetch(`${API_BASE_URL}/api/calendar/events/${eventId}?${params}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to delete event')
  }

  return response.json()
}

// ============================================================================
// Email Endpoints
// ============================================================================

export type Email = {
  external_id: string
  thread_id?: string
  subject: string
  from: string
  to: string
  cc?: string
  snippet: string
  labels: string[]
  is_unread: boolean
  received_at: string | null
  has_attachments: boolean
  attachment_count: number
  message_count?: number  // Number of messages in thread (for threaded view)
  participant_count?: number  // Number of unique participants in thread
}

export type EmailDetail = Email & {
  body?: string
  body_plain?: string
  body_html?: string
  bcc?: string
  date?: string
  message_id?: string
  is_starred?: boolean
  is_important?: boolean
  attachments?: any[]
}

/**
 * Fetch emails for a user
 */
export async function fetchEmails(userId: string, maxResults = 50, query?: string) {
  const params = new URLSearchParams({
    user_id: userId,
    max_results: maxResults.toString(),
    ...(query ? { query } : {})
  })

  const response = await authFetch(`${API_BASE_URL}/api/email/messages?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch emails')
  }

  return response.json()
}

/**
 * Get email details
 */
export async function getEmailDetails(userId: string, emailId: string) {
  const params = new URLSearchParams({
    user_id: userId
  })

  const response = await authFetch(`${API_BASE_URL}/api/email/messages/${emailId}?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch email details')
  }

  return response.json()
}

/**
 * Get all emails in a thread (conversation view)
 */
export async function getThreadEmails(userId: string, threadId: string) {
  const params = new URLSearchParams({
    user_id: userId
  })

  const response = await authFetch(`${API_BASE_URL}/api/email/threads/${threadId}?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch thread emails')
  }

  return response.json()
}

/**
 * Sync emails from Gmail
 */
export async function syncEmails(userId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(`${API_BASE_URL}/api/email/sync?${params}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to sync emails')
  }

  return response.json()
}

/**
 * Send an email
 */
export async function sendEmail(userId: string, data: {
  to: string
  subject: string
  body: string
  cc?: string[]
  bcc?: string[]
  html_body?: string
  thread_id?: string
}) {
  const params = new URLSearchParams({ user_id: userId })
  
  const response = await authFetch(`${API_BASE_URL}/api/email/send?${params}`, {
    method: 'POST',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to send email')
  }

  return response.json()
}

// ============================================================================
// Sync & Watch Management Endpoints
// ============================================================================

export type EnsureWatchesResponse = {
  status: 'all_active' | 'setup_completed' | 'setup_failed' | 'no_connection' | 'partial_setup'
  gmail: {
    active: boolean
    channel_id?: string
    expiration?: string
    notification_count?: number
    error?: string
    reason?: string
  }
  calendar: {
    active: boolean
    channel_id?: string
    expiration?: string
    notification_count?: number
    error?: string
    reason?: string
  }
  message: string
}

/**
 * Ensure watch subscriptions exist for a user.
 * Call this on every login to ensure watches are always active.
 * 
 * This will:
 * - Check if watches exist
 * - Set up missing watches
 * - Renew watches expiring soon
 */
export async function ensureWatches(userId: string): Promise<EnsureWatchesResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/sync/ensure-watches`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to ensure watch subscriptions')
  }

  return response.json()
}

/**
 * Get the current status of watch subscriptions for a user
 */
export async function getWatchStatus(userId: string) {
  const response = await authFetch(`${API_BASE_URL}/api/sync/watch-status/${userId}`)

  if (!response.ok) {
    throw new Error('Failed to get watch status')
  }

  return response.json()
}

/**
 * Manually trigger a sync for Gmail and Calendar
 */
export async function triggerManualSync(userId: string) {
  const response = await authFetch(`${API_BASE_URL}/api/sync/trigger-sync/${userId}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to trigger sync')
  }

  return response.json()
}

// ============================================================================
// Documents Endpoints
// ============================================================================

export type Document = {
  id: string
  user_id: string
  title: string
  content: string
  icon?: string | null
  cover_image?: string | null
  parent_id?: string | null
  is_folder: boolean
  is_archived: boolean
  is_favorite: boolean
  position: number
  last_opened_at?: string | null
  created_at: string
  updated_at: string
}

/**
 * Get all documents for a user
 */
export async function getDocuments(
  userId: string,
  options?: {
    parent_id?: string | null
    include_archived?: boolean
    favorites_only?: boolean
    folders_only?: boolean
    documents_only?: boolean
  }
) {
  const params = new URLSearchParams({
    user_id: userId,
    ...(options?.parent_id ? { parent_id: options.parent_id } : {}),
    ...(options?.include_archived ? { include_archived: 'true' } : {}),
    ...(options?.favorites_only ? { favorites_only: 'true' } : {}),
    ...(options?.folders_only ? { folders_only: 'true' } : {}),
    ...(options?.documents_only ? { documents_only: 'true' } : {}),
  })

  const response = await authFetch(`${API_BASE_URL}/api/documents?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch documents')
  }

  return response.json()
}

/**
 * Get a specific document by ID
 */
export async function getDocument(userId: string, documentId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/${documentId}?${params}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch document')
  }

  return response.json()
}

/**
 * Create a new document
 */
export async function createDocument(
  userId: string,
  data: {
    title?: string
    content?: string
    icon?: string
    cover_image?: string
    parent_id?: string
    position?: number
  }
) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(`${API_BASE_URL}/api/documents?${params}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create document')
  }

  return response.json()
}

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  data: {
    title?: string
    parent_id?: string
    position?: number
  }
) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(`${API_BASE_URL}/api/documents/folders?${params}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create folder')
  }

  return response.json()
}

/**
 * Update an existing document
 */
export async function updateDocument(
  userId: string,
  documentId: string,
  data: {
    title?: string
    content?: string
    icon?: string
    cover_image?: string
    parent_id?: string
    position?: number
  }
) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/${documentId}?${params}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update document')
  }

  return response.json()
}

/**
 * Delete a document permanently
 */
export async function deleteDocument(userId: string, documentId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/${documentId}?${params}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to delete document')
  }

  return true
}

/**
 * Archive a document
 */
export async function archiveDocument(userId: string, documentId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/${documentId}/archive?${params}`,
    {
      method: 'POST',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to archive document')
  }

  return response.json()
}

/**
 * Unarchive a document
 */
export async function unarchiveDocument(userId: string, documentId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/${documentId}/unarchive?${params}`,
    {
      method: 'POST',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to unarchive document')
  }

  return response.json()
}

/**
 * Mark document as favorite
 */
export async function favoriteDocument(userId: string, documentId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/${documentId}/favorite?${params}`,
    {
      method: 'POST',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to favorite document')
  }

  return response.json()
}

/**
 * Remove favorite mark from document
 */
export async function unfavoriteDocument(userId: string, documentId: string) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/${documentId}/unfavorite?${params}`,
    {
      method: 'POST',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to unfavorite document')
  }

  return response.json()
}

/**
 * Reorder documents
 */
export async function reorderDocuments(
  userId: string,
  documentPositions: Array<{ id: string; position: number }>
) {
  const params = new URLSearchParams({ user_id: userId })

  const response = await authFetch(
    `${API_BASE_URL}/api/documents/reorder?${params}`,
    {
      method: 'POST',
      body: JSON.stringify({ document_positions: documentPositions }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to reorder documents')
  }

  return response.json()
}

// ============================================================================
// Tasks Endpoints
// ============================================================================

export type Task = {
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

/**
 * Get all tasks for a user (flat list)
 */
export async function getTasks(
  options?: {
    parent_id?: string | null
    include_completed?: boolean
  }
) {
  const params = new URLSearchParams({
    ...(options?.parent_id ? { parent_id: options.parent_id } : {}),
    ...(options?.include_completed !== undefined
      ? { include_completed: options.include_completed.toString() }
      : {}),
  })

  const url = params.toString() 
    ? `${API_BASE_URL}/api/tasks?${params}`
    : `${API_BASE_URL}/api/tasks`

  const response = await authFetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  return response.json()
}

/**
 * Get task tree (hierarchical structure with nested children)
 */
export async function getTaskTree(include_completed = true) {
  const params = new URLSearchParams({
    include_completed: include_completed.toString(),
  })

  const response = await authFetch(`${API_BASE_URL}/api/tasks/tree?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch task tree')
  }

  return response.json()
}

/**
 * Create a new task
 */
export async function createTask(data: {
  title: string
  notes?: string
  due_date?: string
  parent_id?: string
  position?: number
}) {
  const response = await authFetch(`${API_BASE_URL}/api/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to create task')
  }

  return response.json()
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string
    notes?: string
    due_date?: string
    position?: number
    parent_id?: string
  }
) {
  const response = await authFetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to update task')
  }

  return response.json()
}

/**
 * Toggle task completion status
 */
export async function toggleTaskCompletion(
  taskId: string,
  completed: boolean
) {
  const response = await authFetch(
    `${API_BASE_URL}/api/tasks/${taskId}/completion`,
    {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to toggle task completion')
  }

  return response.json()
}

/**
 * Reorder tasks
 */
export async function reorderTasks(
  taskPositions: Array<{ id: string; position: number }>
) {
  const response = await authFetch(`${API_BASE_URL}/api/tasks/reorder`, {
    method: 'POST',
    body: JSON.stringify({ task_positions: taskPositions }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to reorder tasks')
  }

  return response.json()
}

/**
 * Delete a task and all its subtasks
 */
export async function deleteTask(taskId: string) {
  const response = await authFetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to delete task')
  }

  return true
}

export type { OAuthConnectionData, CalendarEvent }
