/// <reference types="cypress" />

import { FIXTURE_IMAGES } from '../support/fixtures';

describe('Upload', () => {
  it('accepts an image through the header file input and selects it', () => {
    cy.bootApp();

    cy.get('#headerFileInput').selectFile(
      `cypress/fixtures/${FIXTURE_IMAGES.fullExif.path}`,
      { force: true }
    );

    // The image appears in the gallery…
    cy.get(`img[alt="${FIXTURE_IMAGES.fullExif.name}"]`).should('exist');
    // …and becomes the selected image, opening the EXIF panel.
    cy.contains('h2', 'Details').should('be.visible');
    cy.contains(FIXTURE_IMAGES.fullExif.name).should('be.visible');
  });

  it('handles multiple files at once', () => {
    cy.bootApp();

    cy.uploadImages([FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]);

    cy.get(`img[alt="${FIXTURE_IMAGES.fullExif.name}"]`).should('exist');
    cy.get(`img[alt="${FIXTURE_IMAGES.noGps.name}"]`).should('exist');
    cy.contains('Model').next().should('have.text', 'Hound-2');

    // Both images are listed in the investigation image counter.
    cy.switchView('Investigation');
    cy.contains('2 images').should('be.visible');
  });

  it('rejects non-image files', () => {
    cy.bootApp();

    cy.get('#headerFileInput').selectFile('cypress/fixtures/import/points.kml', {
      force: true,
    });

    // No gallery item was added; the empty state stays.
    cy.contains('Upload images to start tracking').should('be.visible');
    cy.get('img[alt="points.kml"]').should('not.exist');
  });

  it('survives a corrupt image without crashing and shows unavailable metadata', () => {
    cy.bootApp();

    cy.uploadImages([FIXTURE_IMAGES.corrupt]);

    // The image entry is created (EXIF parse fails, UI stays stable).
    cy.get(`img[alt="${FIXTURE_IMAGES.corrupt.name}"]`).should('exist');
    cy.contains('h2', 'Details').should('be.visible');

    // Metadata falls back to placeholders instead of garbage or a crash.
    cy.contains('Make').next().should('have.text', 'N/A');
    cy.contains('Model').next().should('have.text', 'N/A');
    cy.contains('Exposure Time').next().should('have.text', 'N/A');
    cy.contains('F-Number').next().should('have.text', 'N/A');
    cy.contains('ISO').next().should('have.text', 'N/A');
    cy.contains('Not available').should('be.visible');

    // App is still interactive afterwards.
    cy.openSettings();
    cy.closeSettings();
  });
});
