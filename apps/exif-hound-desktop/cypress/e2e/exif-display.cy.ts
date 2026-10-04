/// <reference types="cypress" />

import { FIXTURE_IMAGES, FULL_EXIF_EXPECTED as EXPECTED } from '../support/fixtures';

describe('EXIF display', () => {
  beforeEach(() => {
    cy.bootApp();
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
  });

  it('shows the parsed metadata for the selected image', () => {
    const { dateParts } = EXPECTED;

    // Location section: fixture coordinates, 6 decimal places.
    cy.contains('h3', 'Location').should('be.visible');
    cy.contains(EXPECTED.coordinates).should('be.visible');

    // Date Taken formatted by Intl in en-US.
    cy.contains('h3', 'Date Taken').should('be.visible');
    cy.get('.text-app-accent')
      .contains(new RegExp(`${dateParts.month} ${dateParts.day}, ${dateParts.year}`))
      .should('be.visible');
    cy.contains(dateParts.time).should('be.visible');

    // Camera details grid matches the fixture constants.
    cy.contains('h3', 'Camera Details').should('be.visible');
    cy.contains('Make').next().should('have.text', EXPECTED.make);
    cy.contains('Model').next().should('have.text', EXPECTED.model);
    cy.contains('Exposure Time').next().should('have.text', EXPECTED.exposureTime);
    cy.contains('F-Number').next().should('have.text', EXPECTED.fNumber);
    cy.contains('ISO').next().should('have.text', EXPECTED.iso);
    cy.contains('Focal Length').next().should('have.text', EXPECTED.focalLength);

    // File details derived from the uploaded File object.
    cy.contains('h3', 'File Details').should('be.visible');
    cy.contains('Type').next().should('have.text', 'JPEG');
  });

  it('shows "no location" placeholders for images without GPS', () => {
    // This case is about the no-GPS fixture itself. Start from a clean app so
    // the EXIF panel's selected image is unambiguous.
    cy.bootApp();
    cy.uploadImages([FIXTURE_IMAGES.noGps]);
    cy.get(`[data-testid="gallery-item"][data-file-name="${FIXTURE_IMAGES.noGps.name}"]`)
      .should('have.attr', 'aria-pressed', 'true');

    cy.contains('h3', FIXTURE_IMAGES.noGps.name).should('be.visible');
    cy.contains('No location data available').should('be.visible');
    cy.contains('Make').next().should('have.text', 'TestCam');
    cy.contains('Model').next().should('have.text', 'Hound-2');
    cy.contains('Date Taken').parents('.space-y-2').contains('Not available');
  });

  it('opens the full EXIF viewer and returns via Back', () => {
    cy.contains('button', 'View All EXIF Data').click();

    // Lazy-loaded FullExifView replaces the details view.
    cy.contains('Back to Details').should('be.visible');
    // Raw tag tables contain the fixture's raw EXIF keys and values.
    cy.contains('Camera Information').should('be.visible');
    cy.contains('TestCam').should('be.visible');

    cy.contains('button', 'Back to Details').click();
    cy.contains('button', 'View All EXIF Data').should('be.visible');
  });

  it('copies EXIF content to the clipboard', () => {
    cy.contains('button', 'View All EXIF Data').click();
    cy.contains('Back to Details').should('be.visible');

    cy.contains('Exposure Time').parent().parent()
      .find('button[aria-label="Copy to clipboard"]')
      .click({ force: true });

    cy.window().then((win) => {
      const writes = (win as unknown as { __clipboardWrites: string[] }).__clipboardWrites;
      expect(writes).to.have.length.gte(1);
      expect(writes[0]).to.equal('1/250');
    });
  });

  it('shows the file size in KB', () => {
    // cypress/fixtures/images/full-exif.jpg is 6063 bytes → 5.9 KB.
    cy.contains('5.9 KB').should('be.visible');
  });
});
