/// <reference types="cypress" />

describe('App shell', () => {
  it('renders the main UI and serves Tauri commands from the mock', () => {
    cy.bootApp();

    // Header renders the app title and subtitle.
    cy.get('h1').contains('Exif Hound');
    cy.contains('Tracking digital footprints in every image');

    // The mocked bridge serves real command traffic: opening Settings
    // resolves the app version through plugin:app|version.
    cy.openSettings();
    cy.get('[data-testid="app-version"]').should('contain.text', 'Version 2.5.2');

    // The mock records every command the app invoked.
    cy.window()
      .its('__tauriMock.calls')
      .then((calls) => {
        expect(calls).to.include('plugin:app|version');
      });
  });

  it('shows the empty state before any images are uploaded', () => {
    cy.bootApp();

    cy.contains('Upload images to start tracking');
    cy.contains('Drag and drop anywhere or use the upload button');

    // Without images, the view-switching controls are not shown.
    cy.get('header').contains('button', 'Map View').should('not.exist');
    cy.get('header').contains('button', 'List View').should('not.exist');
    cy.get('header').contains('button', 'Investigation').should('not.exist');
    cy.get('header').contains('button', 'Export').should('not.exist');
  });

  it('boots on the light theme when seeded', () => {
    cy.bootApp({ localStorage: { theme: 'light' } });

    cy.get('html').should('have.attr', 'data-theme', 'light');
  });
});