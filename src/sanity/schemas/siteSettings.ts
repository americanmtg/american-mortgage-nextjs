import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
    }),
    defineField({
      name: 'logoHeight',
      title: 'Logo Height (px)',
      type: 'number',
      description: 'Height in pixels (default: 40)',
      initialValue: 40,
    }),
    defineField({
      name: 'logoWhite',
      title: 'Logo (White)',
      type: 'image',
      description: 'White version for dark backgrounds',
    }),
    defineField({
      name: 'logoWhiteHeight',
      title: 'Footer Logo Height (px)',
      type: 'number',
      description: 'Height in pixels (default: 40)',
      initialValue: 40,
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
    }),
    defineField({
      name: 'legalBanner',
      title: 'Legal Banner Text',
      type: 'string',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' };
    },
  },
});
