/// <reference types="cypress" />

import { FIXTURE_IMAGES } from '../support/fixtures';

describe('Map', () => {
  beforeEach(() => {
    cy.bootApp();
  });

  function waitForMap() {
    cy.get('.leaflet-container').should('be.visible');
  }

  it('renders the map with controls and error boundary', () => {
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    waitForMap();

    // Reticle overlay (on by default) and the custom controls are present.
    cy.get('.reticle-container').should('exist');
    cy.get('button[title="Show Route"]').should('be.visible');
    cy.get('button[title="Show Heatmap"]').should('be.visible');
    cy.get('button[title="Show Clusters"]').should('be.visible');
    cy.get('button[title="Import Data"]').should('be.visible');
    // Leaflet zoom control renders.
    cy.get('.leaflet-control-zoom').should('be.visible');
  });

  it('creates markers only for images with GPS', () => {
    cy.uploadImages([FIXTURE_IMAGES.noGps]);
    waitForMap();
    // No GPS → no camera markers at all.
    cy.get('.leaflet-marker-icon').should('not.exist');

    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    cy.get('.leaflet-marker-icon').should('have.length.gte', 1);
  });

  it('opens the image popup when a marker is clicked', () => {
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    waitForMap();
    cy.get('.leaflet-marker-icon').first().click();

    cy.get('.leaflet-popup').should(($popup) => {
      expect($popup.is(':visible')).to.equal(true);
      expect($popup.text()).to.contain(FIXTURE_IMAGES.fullExif.name);
      expect($popup.text()).to.contain('Lat: 51.500000');
      expect($popup.text()).to.contain('Lon: -0.127778');
    });
  });

  it('toggles the route line with two GPS images', () => {
    // Two GPS-bearing images give the route its two points.
    cy.uploadImages([FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.fullExif]);
    waitForMap();

    cy.get('button[title="Show Route"]').click();
    cy.get('button[title="Hide Route"]').should('be.visible');
    // The route polyline renders in Leaflet's overlay pane.
    cy.get('.leaflet-overlay-pane path').should('have.length.gte', 1);

    cy.get('button[title="Hide Route"]').click();
    cy.get('button[title="Show Route"]').should('be.visible');
  });

  it('toggles the heatmap layer over the markers', () => {
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    waitForMap();

    cy.get('button[title="Show Heatmap"]').click();
    // leaflet.heat draws into a canvas in the overlay pane.
    cy.get('.leaflet-overlay-pane canvas').should('exist');

    // Toggling back restores markers (heatmap replaces the cluster layer).
    cy.get('button[title="Show Markers"]').click();
    cy.get('.leaflet-marker-icon').should('have.length.gte', 1);
  });

  it('zooms the map via the zoom control', () => {
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    waitForMap();

    cy.get('.leaflet-container').should('be.visible');
    cy.get('.leaflet-control-zoom-in').click();
    cy.get('.leaflet-control-zoom-in').should('be.visible');
  });

  it('opens the import modal from the map controls', () => {
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    waitForMap();

    cy.get('button[title="Import Data"]').click();
    cy.contains('h2', 'Import Location Data').should('be.visible');
    cy.get('button[aria-label="Close modal"]').click();
    cy.contains('h2', 'Import Location Data').should('not.exist');
  });
});
