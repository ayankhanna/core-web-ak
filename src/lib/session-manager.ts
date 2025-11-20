/**
 * Session Manager - Handles Supabase auth state and token refresh
 */

import { supabase } from './supabase'

/**
 * Initialize session management
 * Sets up listeners for auth state changes and automatic token refresh
 */
export function initializeSessionManager() {
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event)
    
    switch (event) {
      case 'SIGNED_IN':
        console.log('✅ User signed in')
        break
        
      case 'SIGNED_OUT':
        console.log('👋 User signed out')
        // Clear any cached data if needed
        break
        
      case 'TOKEN_REFRESHED':
        console.log('🔄 Token refreshed successfully')
        break
        
      case 'USER_UPDATED':
        console.log('👤 User profile updated')
        break
        
      case 'PASSWORD_RECOVERY':
        console.log('🔐 Password recovery initiated')
        break
    }
    
    // Log token expiration time for debugging
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000)
      console.log('Token expires at:', expiresAt.toLocaleString())
    }
  })
  
  // Check session on initialization
  checkSession()
}

/**
 * Check current session status
 */
async function checkSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error checking session:', error)
      return
    }
    
    if (data.session) {
      console.log('✅ Active session found')
      const expiresAt = new Date(data.session.expires_at! * 1000)
      console.log('Token expires at:', expiresAt.toLocaleString())
    } else {
      console.log('ℹ️ No active session')
    }
  } catch (error) {
    console.error('Error checking session:', error)
  }
}

/**
 * Force refresh the current session token
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.error('Error refreshing session:', error)
      throw error
    }
    
    console.log('✅ Session refreshed successfully')
    return data.session
  } catch (error) {
    console.error('Failed to refresh session:', error)
    throw error
  }
}




