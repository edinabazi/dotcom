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
      name: 'Marund',
      cssVariable: '--font-marund',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/fonts/Marund.woff2'],
            weight: '100 900',
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
