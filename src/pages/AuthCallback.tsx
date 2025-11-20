import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeOAuthFlow, ensureWatches } from '@/lib/api-client'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('=== AUTH CALLBACK STARTED ===')
    console.log('Full URL:', window.location.href)
    
    const handleCallback = async () => {
      try {
        // Parse ALL tokens from hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const providerToken = hashParams.get('provider_token')
        const providerRefreshToken = hashParams.get('provider_refresh_token')
        
        console.log('Tokens extracted:', {
          accessToken: accessToken ? '✓' : '✗',
          refreshToken: refreshToken ? '✓' : '✗',
          providerToken: providerToken ? '✓' : '✗',
          providerRefreshToken: providerRefreshToken ? '✓' : '✗'
        })

        if (!accessToken || !refreshToken) {
          console.error('❌ Missing required tokens!')
          setError('Missing authentication tokens')
          setTimeout(() => navigate('/login'), 2000)
          return
        }

        // Decode the access token to get user info (it's a JWT)
        console.log('Decoding access token...')
        const tokenParts = accessToken.split('.')
        if (tokenParts.length !== 3) {
          console.error('❌ Invalid token format')
          setError('Invalid token format')
          setTimeout(() => navigate('/login'), 2000)
          return
        }

        const payload = JSON.parse(atob(tokenParts[1]))
        console.log('Token payload:', payload)

        const userId = payload.sub
        const email = payload.email
        const userMetadata = payload.user_metadata || {}

        console.log('User info from token:', { userId, email, userMetadata })

        if (!userId || !email) {
          console.error('❌ Missing user info in token')
          setError('Invalid user data')
          setTimeout(() => navigate('/login'), 2000)
          return
        }

        // Store tokens in localStorage for the session
        console.log('Storing tokens in localStorage...')
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: payload.exp,
          user: {
            id: userId,
            email: email,
            user_metadata: userMetadata
          }
        }))

        // Call backend API to create user and store OAuth tokens
        try {
          console.log('Calling backend API to create user...')
          console.log('API URL:', import.meta.env.VITE_API_URL)
          
          const response = await completeOAuthFlow({
            user_id: userId,
            email: email,
            name: userMetadata.full_name || email.split('@')[0],
            avatar_url: userMetadata.avatar_url,
            provider: 'google',
            provider_user_id: userMetadata.provider_id || userMetadata.sub || userId,
            access_token: providerToken || '',
            refresh_token: providerRefreshToken || undefined,
            scopes: [
              'https://www.googleapis.com/auth/calendar',
              'https://mail.google.com/'
            ],
            metadata: {
              picture: userMetadata.picture,
              full_name: userMetadata.full_name,
              email_verified: userMetadata.email_verified,
            }
          })

          console.log('✅ Backend API response:', response)
          
          // Set up watch subscriptions for real-time sync
          console.log('🔔 Setting up watch subscriptions...')
          try {
            const watchResult = await ensureWatches(userId)
            console.log('✅ Watch subscriptions:', watchResult)
            
            if (watchResult.status === 'all_active' || watchResult.status === 'setup_completed') {
              console.log('✅ Real-time sync enabled!')
            } else if (watchResult.status === 'partial_setup') {
              console.log('⚠️ Partial watch setup - some subscriptions may be missing')
            } else {
              console.log('⚠️ Watch setup incomplete - will retry via background jobs')
            }
          } catch (watchError: any) {
            // Don't fail login if watch setup fails - cron jobs will retry
            console.warn('⚠️ Watch setup error (will retry automatically):', watchError.message)
          }
          
          console.log('✅ User created successfully! Navigating to dashboard...')
          
          // Clean up the hash from URL
          window.history.replaceState({}, document.title, '/dashboard')
          navigate('/dashboard')
        } catch (apiError: any) {
          console.error('❌ Backend API error:', apiError)
          console.error('Error details:', apiError.message)
          
          // Check if it's a CORS or network error
          if (apiError.message.includes('fetch') || apiError.message.includes('Failed to fetch')) {
            setError(`Cannot connect to API at ${import.meta.env.VITE_API_URL}. Is the backend running?`)
          } else {
            setError(`API Error: ${apiError.message}`)
          }
          
          // Still redirect to dashboard after showing error briefly
          console.log('Redirecting to dashboard in 3 seconds...')
          setTimeout(() => {
            window.history.replaceState({}, document.title, '/dashboard')
            navigate('/dashboard')
          }, 3000)
        }
        
      } catch (err: any) {
        console.error('❌ Callback error:', err)
        setError(err.message || 'Authentication failed')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-500 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium text-lg">Authentication Error</p>
            <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{error}</p>
            <p className="text-gray-500 text-xs mt-4">Check console for details</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Completing authentication...</p>
        <p className="mt-2 text-gray-500 text-sm">Check browser console for logs</p>
        <p className="mt-1 text-gray-500 text-sm">Check terminal for API logs</p>
      </div>
    </div>
  )
}
