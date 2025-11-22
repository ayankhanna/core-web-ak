/**
 * Types for Documents feature
 */

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

export type DocumentTreeNode = Document & {
  children?: DocumentTreeNode[]
}

