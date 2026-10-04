/**
 * Reusable Cypress commands for the Exif Hound E2E suite.
 */

import { ExifFixture } from './fixtures';

/** Upload image fixtures through the header file input and wait for EXIF processing. */
function uploadImages(fixtures: ExifFixture[]): void {
  cy.get('#headerFileInput').selectFile(
    fixtures.map((f) => `cypress/fixtures/${f.path}`),
    { force: true }
  );
  // Wait for worker-backed EXIF extraction, not just the immediate placeholder
  // gallery item. Otherwise tests can export or inspect the loading state.
  const counts = new Map<string, number>();
  fixtures.forEach(({ name }) => counts.set(name, (counts.get(name) ?? 0) + 1));
  counts.forEach((count, name) => {
    cy.get(`[data-testid="gallery-item"][data-file-name="${name}"]`).should(($items) => {
      expect($items).to.have.length(count);
      $items.each((_, item) => {
        expect(item).to.have.attr('data-processing', 'false');
      });
    });
  });
}

Cypress.Commands.add('uploadImages', { prevSubject: false }, uploadImages);

Cypress.Commands.add('openSettings', () => {
  cy.get('button[aria-label="Open settings"]').click();
  cy.get('h1').contains('Settings');
});

Cypress.Commands.add('closeSettings', () => {
  cy.get('button[aria-label="Close settings"]').click();
  cy.get('h1').contains('Settings').should('not.exist');
});

Cypress.Commands.add('switchView', (name: 'Map View' | 'List View' | 'Investigation') => {
  cy.get('header').contains('button', name).click();
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Upload image fixtures through the header input. */
      uploadImages(fixtures: ExifFixture[]): void;
      /** Open the settings screen via the header gear button. */
      openSettings(): void;
      /** Close the settings screen and assert it is gone. */
      closeSettings(): void;
      /** Switch the main view via the header buttons. */
      switchView(name: 'Map View' | 'List View' | 'Investigation'): void;
    }
  }
}
