// Directory Types

export interface Review {
  id: number;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Professional {
  id: number;
  name: string;
  company?: string;
  category: string;
  description: string;
  photo?: string;
  serviceArea: string[];
  phone: string;
  email: string;
  website?: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  isFeatured: boolean;
  city: string;
  county: string;
  reviews?: Review[];
}

export interface FilterState {
  search: string;
  category: string;
  city: string;
  county: string;
  minRating: number;
  minYearsExperience: number;
  featuredOnly: boolean;
}

export type SortOption = 'name_asc' | 'name_desc' | 'rating_desc' | 'reviews_desc' | 'experience_desc';

export const CATEGORIES = [
  'All Categories',
  'Realtor',
  'Title Company',
  'Insurance Agent',
  'Home Inspector',
  'Appraiser',
  'Handyman',
  'Electrician',
  'Plumber',
  'HVAC Technician',
  'Roofer',
  'General Contractor',
  'Landscaper',
  'Pest Control',
  'Cleaning Service',
] as const;

export const CITIES = [
  'All Cities',
  'Jonesboro',
  'Little Rock',
  'Fayetteville',
  'Fort Smith',
  'Springdale',
  'Conway',
  'Rogers',
  'North Little Rock',
  'Bentonville',
  'Pine Bluff',
] as const;

export const COUNTIES = [
  'All Counties',
  'Craighead',
  'Pulaski',
  'Washington',
  'Sebastian',
  'Benton',
  'Faulkner',
  'Saline',
  'Garland',
  'Jefferson',
  'White',
] as const;

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'reviews_desc', label: 'Most Reviewed' },
  { value: 'experience_desc', label: 'Most Experienced' },
];
