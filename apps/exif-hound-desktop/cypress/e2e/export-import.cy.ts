/// <reference types="cypress" />

import { FIXTURE_IMAGES, FIXTURE_IMPORT } from '../support/fixtures';

describe('Export', () => {
  beforeEach(() => {
    cy.bootApp();
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
  });

  function openExport() {
    cy.get('header').contains('button', 'Export').click();
    cy.contains('h2', 'Export Data').should('be.visible');
    cy.contains('Export includes all metadata from 1 images');
  }

  it('exports CSV through the save picker with generated content', () => {
    openExport();
    cy.contains('button', 'Export as CSV').click();

    // Modal closes on success and the picker received the generated CSV.
    cy.contains('h2', 'Export Data').should('not.exist');
    cy.window().then((win) => {
      const aut = win as unknown as {
        __savePickerCalls: { suggestedName: string; types: { accept: Record<string, string[]> } }[];
        __lastSaveWritable: { content: string };
      };
      const options = aut.__savePickerCalls[0];
      expect(options.suggestedName).to.match(/^exif-hound-data-/);
      expect(JSON.stringify(options.types)).to.include('text/csv');
      const csv = aut.__lastSaveWritable.content;
      expect(csv).to.contain('File Name');
      expect(csv).to.contain('full-exif.jpg');
      expect(csv).to.contain('TestCam');
      expect(csv).to.contain('Hound-1');
      expect(csv).to.contain('51.5');
    });
  });

  it('exports JSON with the parsed metadata', () => {
    openExport();
    cy.contains('button', 'Export as JSON').click();

    cy.contains('h2', 'Export Data').should('not.exist');
    cy.window().then((win) => {
      const aut = win as unknown as {
        __savePickerCalls: { suggestedName: string; types: { accept: Record<string, string[]> } }[];
        __lastSaveWritable: { content: string };
      };
      const options = aut.__savePickerCalls[0];
      expect(JSON.stringify(options.types)).to.include('application/json');
      const parsed = JSON.parse(aut.__lastSaveWritable.content);
      const entry = Array.isArray(parsed) ? parsed[0] : parsed.images?.[0];
      expect(JSON.stringify(entry)).to.include('TestCam');
      expect(JSON.stringify(entry)).to.include('full-exif.jpg');
    });
  });

  it('shows an error and stays open when saving fails', () => {
    openExport();

    // Simulate the user cancelling the native save dialog (AbortError).
    cy.window().then((win) => {
      Object.defineProperty(win, 'showSaveFilePicker', {
        value: () => Promise.reject(new DOMException('cancelled', 'AbortError')),
        configurable: true,
      });
    });

    cy.contains('button', 'Export as CSV').click();
    cy.contains('Failed to save CSV file. Please try again.').should('be.visible');
    cy.contains('h2', 'Export Data').should('be.visible');
  });
});

describe('Import', () => {
  beforeEach(() => {
    cy.bootApp();
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    // Import lives in the map controls.
    cy.switchView('Map View');
    cy.get('.leaflet-container').should('be.visible');
    cy.get('button[title="Import Data"]').click();
    cy.contains('h2', 'Import Location Data').should('be.visible');
  });

  it('imports a valid KML file and adds its placemarks to the map', () => {
    cy.get('#fileInput').selectFile(`cypress/fixtures/${FIXTURE_IMPORT.kml.path}`, {
      force: true,
    });

    // Modal closes after a successful import.
    cy.contains('h2', 'Import Location Data').should('not.exist');

    // KML points render as GeoJSON circle paths, not camera marker icons.
    cy.get('.leaflet-overlay-pane path').should('have.length.gte', 2);
  });

  it('supports switching to CSV format', () => {
    cy.contains('button', 'CSV').click();
    cy.contains('latitude').should('be.visible');
    cy.contains('longitude').should('be.visible');
  });

  it('shows an error for invalid KML and dismisses it', () => {
    cy.get('#fileInput').selectFile(`cypress/fixtures/${FIXTURE_IMPORT.invalid.path}`, {
      force: true,
    });

    // The modal stays open with a role=alert error.
    cy.contains('h2', 'Import Location Data').should('be.visible');
    cy.get('[role="alert"]').should('be.visible');
    cy.contains('Invalid KML file format').should('be.visible');

    // Cancel closes the modal; the app-level error banner is dismissible.
    cy.contains('button', 'Cancel').click();
    // This pre-validation error belongs to the import modal and clears when
    // the modal closes; it does not create the separate app-level banner.
    cy.contains('h2', 'Import Location Data').should('not.exist');
  });
});
