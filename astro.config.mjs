// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

import robotsTxt from 'astro-robots-txt';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://edinabazi.com',

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Suisse Intl',
      cssVariable: '--font-suisse-intl',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/fonts/SuisseIntl-Regular.woff2'],
            weight: 400,
            style: 'normal',
          },
          {
            src: ['./src/fonts/SuisseIntl-Medium.woff2'],
            weight: 500,
            style: 'normal',
          },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap(), mdx(), robotsTxt(), react()]
});
