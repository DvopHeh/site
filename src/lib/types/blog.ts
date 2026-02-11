export interface Post {
  id: number;
  title: string;
  slug: string;
  description?: string;
  content: string;
  featured_image?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}
