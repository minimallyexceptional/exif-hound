/// <reference types="cypress" />

import { APP_VERSION } from '../support/app';

describe('Settings', () => {
  beforeEach(() => {
    cy.bootApp();
    cy.openSettings();
  });

  it('renders all sections', () => {
    cy.contains('h2', 'Appearance').should('be.visible');
    cy.contains('h2', 'Map Settings').should('be.visible');
    cy.contains('h2', 'About').should('be.visible');

    // Version resolved through the mocked Tauri bridge.
    cy.get('[data-testid="app-version"]').should('contain.text', `Version ${APP_VERSION}`);

    // Theme choice buttons.
    cy.contains('button', 'Light').should('be.visible');
    cy.contains('button', 'Dark').should('be.visible');
  });

  it('closes via the close button', () => {
    cy.closeSettings();
  });

  it('changes the theme from the appearance section', () => {
    cy.contains('button', 'Light').click();
    cy.get('html').should('have.attr', 'data-theme', 'light');
    // The "Light" card is now the selected one (border highlights).
    cy.contains('button', 'Light').should('have.class', 'border-app-white');

    cy.contains('button', 'Dark').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });

  it('selects a map style and persists it to localStorage', () => {
    // OSM standard is the default selection.
    cy.window().then((win) => {
      expect(JSON.parse(win.localStorage.getItem('mapSettings')!).selectedStyle)
        .to.equal('osm-standard');
    });

    // Pick the second style card (any non-default style works).
    cy.get('h2').contains('Map Settings')
      .parents('section')
      .find('button img[alt]')
      .its('length')
      .then((count) => {
        expect(count).to.be.gte(2);
      });
    cy.get('h2').contains('Map Settings')
      .parents('section')
      .find('button img[alt]')
      .eq(1)
      .click();

    cy.window().then((win) => {
      expect(JSON.parse(win.localStorage.getItem('mapSettings')!).selectedStyle)
        .to.not.equal('osm-standard');
    });
  });

  it('toggles the custom tile server and persists the URL', () => {
    const url = 'https://{s}.tiles.example.org/{z}/{x}/{y}.png';

    cy.get('input[type="checkbox"]').check({ force: true });
    cy.get('input[type="text"]').type(url);

    cy.window().then((win) => {
      const settings = JSON.parse(win.localStorage.getItem('mapSettings')!);
      expect(settings.customTiles.enabled).to.equal(true);
      expect(settings.customTiles.url).to.contain('tiles.example.org');
    });
  });

  it('reports "up to date" after a manual update check', () => {
    cy.contains('button', 'Check for Updates').click();
    cy.get('[data-testid="update-status"]').should('contain.text', "You're up to date.");
  });
});
