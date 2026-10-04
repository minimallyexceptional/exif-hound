/// <reference types="cypress" />

import { FIXTURE_IMAGES } from '../support/fixtures';

describe('Image comparison', () => {
  beforeEach(() => {
    cy.bootApp();
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
  });

  it('opens the comparison modal from the details panel', () => {
    cy.contains('button', 'Compare with EXIF Thumbnail').click();

    // Modal chrome with the two compared images.
    cy.contains('h2', 'Image Comparison').should('be.visible');
    cy.get('img[alt="Original"]').should('exist');
    cy.get('img[alt="Thumbnail"]').should('exist');
  });

  it('closes the comparison modal cleanly', () => {
    cy.contains('button', 'Compare with EXIF Thumbnail').click();
    cy.contains('h2', 'Image Comparison').should('be.visible');

    cy.get('button[aria-label="Close modal"]').click();
    cy.contains('h2', 'Image Comparison').should('not.exist');

    // The app remains interactive afterwards.
    cy.contains('button', 'Compare with EXIF Thumbnail').should('be.visible');
  });
});