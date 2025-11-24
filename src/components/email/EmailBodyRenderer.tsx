import { useMemo } from 'react'
import DOMPurify from 'dompurify'

interface EmailBodyRendererProps {
  body: string
  isFromCurrentUser?: boolean
}

export default function EmailBodyRenderer({ body, isFromCurrentUser = false }: EmailBodyRendererProps) {
  const processedBody = useMemo(() => {
    if (!body) return { html: '', isHtml: false }

    // Strip quoted text first
    let cleaned = body.replace(/On\s+.+?wrote:\s*\n+>?.*/gis, '')
    cleaned = cleaned.split('\n').filter(line => !line.trim().startsWith('>')).join('\n')
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    cleaned = cleaned.trim()

    // Check if the body contains HTML
    const hasHtml = /<[a-z][\s\S]*>/i.test(cleaned)

    if (hasHtml) {
      // Sanitize HTML to prevent XSS attacks
      const sanitized = DOMPurify.sanitize(cleaned, {
        ALLOWED_TAGS: [
          'a', 'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'div', 'span',
          'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'img', 'hr', 'center'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
          'style', 'class', 'align', 'valign', 'cellpadding', 'cellspacing', 'border'
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      })
      return { html: sanitized, isHtml: true }
    } else {
      // Convert plain text URLs to clickable links
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const withLinks = cleaned.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-300 transition-colors">${url}</a>`
      })
      return { html: withLinks, isHtml: false }
    }
  }, [body])

  const linkColorClass = isFromCurrentUser 
    ? '[&_a]:text-blue-100 hover:[&_a]:text-white' 
    : '[&_a]:text-blue-600 hover:[&_a]:text-blue-700'

  const baseStyles = `
    ${processedBody.isHtml ? 'text-base' : 'text-sm whitespace-pre-wrap'}
    break-words overflow-wrap-anywhere overflow-x-hidden
    ${linkColorClass}
    [&_a]:underline [&_a]:transition-colors [&_a]:break-all
    [&_img]:max-w-full [&_img]:h-auto
    [&_table]:max-w-full [&_table]:overflow-x-auto
    ${!processedBody.isHtml ? `
      [&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0
      [&_ul]:my-2 [&_ol]:my-2 [&_ul]:pl-6 [&_ol]:pl-6
      [&_li]:my-1
      [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2
      [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2
      [&_h3]:text-base [&_h3]:font-bold [&_h3]:my-2
      [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:italic
      [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
      [&_pre]:bg-black/10 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-2
    ` : ''}
  `

  return (
    <div
      className={baseStyles}
      dangerouslySetInnerHTML={{ __html: processedBody.html }}
    />
  )
}

