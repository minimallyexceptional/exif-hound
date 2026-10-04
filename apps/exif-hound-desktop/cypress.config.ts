import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // The frontend is served by a dedicated Vite dev server on its own port
    // (`npm run dev:test`, started automatically for cy:run / cy:open via
    // start-server-and-test). A dedicated strictPort keeps E2E runs from
    // colliding with a manually running `npm run dev` on 5176.
    baseUrl: 'http://localhost:5276',
    // The first visit of a fresh dev server compiles the whole module graph
    // (including lazy chunks) before `load` fires; give it generous headroom.
    pageLoadTimeout: 120000,
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    // Desktop-app layout: above the lg (1024px) breakpoint so the desktop
    // header/actions render.
    viewportWidth: 1600,
    viewportHeight: 900,
    screenshotOnRunFailure: true,
    video: false,
    setupNodeEvents(on, config) {
      // No plugins needed yet; hook point reserved for future tasks.
      return config;
    },
  },
});
