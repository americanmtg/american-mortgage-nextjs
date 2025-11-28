import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        { name: 'badge', type: 'string', title: 'Badge Text' },
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'titleEmphasis', type: 'string', title: 'Title Emphasis' },
        { name: 'subtext', type: 'text', title: 'Subtext' },
        { name: 'buttonText', type: 'string', title: 'Button Text' },
        { name: 'buttonUrl', type: 'string', title: 'Button URL' },
        { name: 'backgroundImage', type: 'image', title: 'Background Image' },
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Stats Bar',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'number', type: 'string', title: 'Number' },
            { name: 'label', type: 'string', title: 'Label' },
          ],
        },
      ],
    }),
    defineField({
      name: 'featuredLoans',
      title: 'Featured Loans',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'description', type: 'text', title: 'Description' },
            { name: 'showDPA', type: 'boolean', title: 'Show DPA Badge' },
            { name: 'features', type: 'array', title: 'Features', of: [{ type: 'string' }] },
            { name: 'buttonText', type: 'string', title: 'Button Text' },
            { name: 'buttonUrl', type: 'string', title: 'Button URL' },
          ],
        },
      ],
    }),
    defineField({
      name: 'dpa',
      title: 'DPA Section',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'description', type: 'text', title: 'Description' },
        { name: 'features', type: 'array', title: 'Features', of: [{ type: 'string' }] },
        { name: 'buttonText', type: 'string', title: 'Button Text' },
        { name: 'buttonUrl', type: 'string', title: 'Button URL' },
        { name: 'image', type: 'image', title: 'Image' },
      ],
    }),
    defineField({
      name: 'tools',
      title: 'Tools Section',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'description', type: 'string', title: 'Description' },
            { name: 'icon', type: 'string', title: 'Icon' },
            { name: 'url', type: 'string', title: 'URL' },
          ],
        },
      ],
    }),
    defineField({
      name: 'agentSection',
      title: 'Agent Section',
      type: 'object',
      fields: [
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'description', type: 'text', title: 'Description' },
        { name: 'buttonText', type: 'string', title: 'Button Text' },
        { name: 'buttonUrl', type: 'string', title: 'Button URL' },
        { name: 'image', type: 'image', title: 'Agent Photo' },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Homepage' };
    },
  },
});
