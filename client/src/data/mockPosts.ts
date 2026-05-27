import type { BlogPost } from '../types';

export const mockPosts: BlogPost[] = [
  {
    id: '1',
    title: 'New Studio Rituals for Autumn',
    slug: 'new-studio-rituals-autumn',
    excerpt: 'A short journal entry about morning light, new palettes, and planning the next western series.',
    date: 'October 10, 2025',
    tags: ['Studio', 'Process'],
  },
  {
    id: '2',
    title: 'Choosing the Right Print for Your Home',
    slug: 'choosing-the-right-print',
    excerpt: 'How to match size, surface, and mood when selecting a print for a collector’s living space.',
    date: 'August 2, 2025',
    tags: ['Prints', 'Collections'],
  },
  {
    id: '3',
    title: 'Behind the Brush: Western Light',
    slug: 'behind-the-brush-western-light',
    excerpt: 'Exploring the color, shadow, and storytelling in western plains and mountain light.',
    date: 'June 17, 2025',
    tags: ['Inspiration', 'Landscape'],
  },
];
