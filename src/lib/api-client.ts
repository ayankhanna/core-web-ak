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
}

export type EmailDetail = Email & {
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

export type { OAuthConnectionData, CalendarEvent }
