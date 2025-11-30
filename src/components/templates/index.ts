// Template exports - add new templates here
export { default as Template1 } from './Template1';

// Template type for type safety
export type TemplateType = 'default' | 'template-1';

// Template configuration for UI display
export const TEMPLATES: Record<TemplateType, { name: string; description: string }> = {
  'default': {
    name: 'Default',
    description: 'Simple page layout with title and content',
  },
  'template-1': {
    name: 'Template 1 - Professional',
    description: 'Two-column layout with hero section, sidebar, and CTA banner',
  },
};
