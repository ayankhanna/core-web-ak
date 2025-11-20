import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { MdLightMode, MdDarkMode } from 'react-icons/md'

export default function Login() {
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
      }
    }
    checkUser()
  }, [])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/calendar https://mail.google.com/',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        }
      })

      if (error) throw error
    } catch (err: any) {
      console.error('Error logging in:', err)
      setError(err.message || 'Failed to login')
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setCurrentUser(null)
      setError(null)
      setLoading(false)
    } catch (err: any) {
      console.error('Error logging out:', err)
      setError(err.message || 'Failed to logout')
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center transition-colors duration-200 relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-6 right-6 p-3 rounded-xl transition-all duration-200"
        style={{
          backgroundColor: isDarkMode ? '#1a1a1a' : '#f1f3f5',
          color: 'var(--text-primary)'
        }}
        title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
      >
        {isDarkMode ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
      </button>

      <div 
        className="p-8 rounded-2xl shadow-xl w-full max-w-md transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: `1px solid var(--border-color)`
        }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center font-bold text-2xl"
            style={{
              backgroundColor: isDarkMode ? '#000000' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#000000',
              border: `2px solid ${isDarkMode ? '#333' : '#ddd'}`
            }}
          >
            10x
          </div>
          <h1 
            className="text-3xl font-bold mb-2 transition-colors duration-200"
            style={{ color: 'var(--text-primary)' }}
          >
            Welcome to 10x
          </h1>
          <p 
            className="transition-colors duration-200"
            style={{ color: 'var(--text-secondary)' }}
          >
            Your all-in-one productivity app
          </p>
        </div>

        {error && (
          <div 
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
              border: `1px solid ${isDarkMode ? '#991b1b' : '#fecaca'}`,
              color: isDarkMode ? '#fca5a5' : '#dc2626'
            }}
          >
            <p className="text-sm">{error}</p>
          </div>
        )}

        {currentUser && (
          <div 
            className="mb-6 p-4 rounded-lg"
            style={{
              backgroundColor: isDarkMode ? '#1e3a8a' : '#dbeafe',
              border: `1px solid ${isDarkMode ? '#1e40af' : '#bfdbfe'}`,
            }}
          >
            <p 
              className="text-sm font-medium"
              style={{ color: isDarkMode ? '#93c5fd' : '#1e40af' }}
            >
              Already signed in
            </p>
            <p 
              className="text-xs mt-1"
              style={{ color: isDarkMode ? '#93c5fd' : '#2563eb' }}
            >
              {currentUser.email}
            </p>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: isDarkMode ? '#ffffff' : '#000000',
                color: isDarkMode ? '#000000' : '#ffffff',
              }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isDarkMode ? '#7f1d1d' : '#dc2626',
                color: '#ffffff',
              }}
            >
              {loading ? 'Signing out...' : 'Sign Out & Start Fresh'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: `2px solid var(--border-color)`,
              color: 'var(--text-primary)',
            }}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        )}

        <div className="mt-6 text-center">
          <p 
            className="text-xs transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)' }}
          >
            By signing in, you agree to access and manage your Google Calendar and Gmail
          </p>
        </div>
      </div>
    </div>
  )
}


