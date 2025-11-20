import { useDarkMode } from '@/contexts/DarkModeContext'
import { MdConstruction } from 'react-icons/md'

interface PlaceholderViewProps {
  title: string
  description: string
}

export default function PlaceholderView({ title, description }: PlaceholderViewProps) {
  const { isDarkMode } = useDarkMode()

  return (
    <div 
      className="h-full flex flex-col items-center justify-center transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="text-center max-w-md px-8">
        <MdConstruction 
          size={80} 
          className="mx-auto mb-6 transition-colors duration-200"
          style={{ color: 'var(--text-tertiary)' }}
        />
        <h2 
          className="text-3xl font-bold mb-4 transition-colors duration-200"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        <p 
          className="text-lg transition-colors duration-200"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
        <div 
          className="mt-8 px-6 py-3 rounded-lg inline-block"
          style={{ 
            backgroundColor: isDarkMode ? '#1a1a1a' : '#f1f3f5',
            color: 'var(--text-tertiary)'
          }}
        >
          <p className="text-sm font-medium">Coming Soon</p>
        </div>
      </div>
    </div>
  )
}




