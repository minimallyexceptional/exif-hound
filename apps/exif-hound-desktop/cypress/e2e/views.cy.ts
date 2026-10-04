/// <reference types="cypress" />

import { FIXTURE_IMAGES } from '../support/fixtures';

describe('Views and navigation', () => {
  beforeEach(() => {
    cy.bootApp();
    cy.uploadImages([FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]);
  });

  it('switches between map, list, and investigation views', () => {
    // Map is the default view.
    cy.contains('h2', 'Location Map').should('be.visible');
    cy.get('header').contains('button', 'Map View').should('have.class', 'bg-app-white');

    cy.switchView('List View');
    cy.contains('h2', 'Image Details').should('be.visible');
    cy.get('header').contains('button', 'List View').should('have.class', 'bg-app-white');

    cy.switchView('Investigation');
    cy.contains('h2', 'Investigation Dashboard').should('be.visible');
    cy.get('header').contains('button', 'Investigation').should('have.class', 'bg-app-white');

    cy.switchView('Map View');
    cy.contains('h2', 'Location Map').should('be.visible');
  });

  it('collapses and expands the gallery sidebar', () => {
    cy.contains('h2', 'Gallery').should('be.visible');
    cy.get('button[aria-label="Collapse gallery"]').click();
    cy.get('button[aria-label="Expand gallery"]').should('be.visible');
    cy.contains('h2', 'Gallery').should('not.exist');

    cy.get('button[aria-label="Expand gallery"]').click();
    cy.get('button[aria-label="Collapse gallery"]').should('be.visible');
    cy.contains('h2', 'Gallery').should('be.visible');
  });

  it('collapses and expands the EXIF details panel', () => {
    cy.contains('h2', 'Details').should('be.visible');
    cy.get('button[aria-label="Collapse details"]').click();
    cy.get('button[aria-label="Expand details"]').should('be.visible');
    cy.contains('h2', 'Details').should('not.exist');

    cy.get('button[aria-label="Expand details"]').click();
    cy.contains('h2', 'Details').should('be.visible');
  });

  it('opens the help menu and its entries work', () => {
    cy.get('button[aria-label="Help menu"]').click();
    cy.get('#help-menu').should('be.visible');
    cy.get('#help-menu').contains('Check for Updates');
    cy.get('#help-menu').contains('About Exif Hound');

    // About entry opens Settings.
    cy.get('#help-menu').contains('About Exif Hound').click();
    cy.contains('h1', 'Settings').should('be.visible');
    cy.closeSettings();

    // Check for Updates entry opens Settings with the manual updater UI.
    cy.get('button[aria-label="Help menu"]').click();
    cy.get('#help-menu').contains('Check for Updates').click();
    cy.contains('h1', 'Settings').should('be.visible');
    cy.get('[data-testid="update-status"]').should('contain.text', "You're up to date.");
    cy.closeSettings();
  });

  it('selects images from the gallery', () => {
    // Select the no-gps thumbnail with the keyboard; the details panel should follow.
    cy.get(`[data-testid="gallery-item"][data-file-name="${FIXTURE_IMAGES.noGps.name}"]`)
      .focus().type('{enter}');
    cy.get(`[data-testid="gallery-item"][data-file-name="${FIXTURE_IMAGES.noGps.name}"]`)
      .should('have.attr', 'aria-pressed', 'true');
    cy.contains('Model').next().should('have.text', 'Hound-2');
  });

  it('navigates the list view spreadsheet and selects rows', () => {
    cy.switchView('List View');

    cy.get('[aria-label="Image metadata spreadsheet"]').should('be.visible');
    cy.get('[role="columnheader"][aria-label="Thumbnail"]').should('be.visible');

    // Both images are listed with their names.
    cy.contains(FIXTURE_IMAGES.fullExif.name).should('be.visible');
    cy.contains(FIXTURE_IMAGES.noGps.name).should('be.visible');
  });
});
