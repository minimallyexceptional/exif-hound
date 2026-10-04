/// <reference types="cypress" />

import { FIXTURE_IMAGES } from '../support/fixtures';

const TOOLS = [
  { name: 'Pattern Analysis', label: 'Open Pattern Analysis' },
  { name: 'Geolocation Analysis', label: 'Open Geolocation Analysis' },
  { name: 'Timeline Analysis', label: 'Open Timeline Analysis' },
  { name: 'Software Processing', label: 'Open Software Processing' },
];

describe('Investigation', () => {
  beforeEach(() => {
    cy.bootApp();
    cy.uploadImages([FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]);
    cy.switchView('Investigation');
  });

  it('shows the dashboard with all four tools and the image count', () => {
    cy.contains('h2', 'Investigation Dashboard').should('be.visible');
    cy.contains('2 images').should('be.visible');

    for (const tool of TOOLS) {
      cy.contains('h3', tool.name).should('be.visible');
      cy.get(`button[aria-label="${tool.label}"]`).should('be.enabled');
    }
  });

  for (const tool of TOOLS) {
    it(`renders ${tool.name} without errors`, () => {
      cy.get(`button[aria-label="${tool.label}"]`).click();

      // Tool chrome: back button, active tool title, fullscreen toggle.
      cy.contains('button', 'Back').should('be.visible');
      cy.get('h2').contains(tool.name).should('be.visible');
      cy.get('button[aria-label="Enter fullscreen"]').should('be.visible');

      // The analysis surface rendered actual content.
      cy.get('.flex-1.overflow-auto').children().should('have.length.gte', 1);

      // Back returns to the dashboard.
      cy.contains('button', 'Back').click();
      cy.contains('h2', 'Investigation Dashboard').should('be.visible');
    });
  }

  it('toggles fullscreen for an analysis tool', () => {
    cy.get('button[aria-label="Open Timeline Analysis"]').click();
    cy.get('button[aria-label="Enter fullscreen"]').click();
    cy.get('button[aria-label="Exit fullscreen"]').should('be.visible');

    // Escape also exits fullscreen.
    cy.get('body').type('{esc}');
    cy.get('button[aria-label="Enter fullscreen"]').should('be.visible');
  });
});