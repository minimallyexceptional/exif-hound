/// <reference types="cypress" />

import { FIXTURE_IMAGES } from '../support/fixtures';

describe('Accessibility and responsive behavior', () => {
  beforeEach(() => {
    cy.bootApp();
  });

  it('gives every icon-only control an accessible name', () => {
    cy.uploadImages([FIXTURE_IMAGES.fullExif]);
    cy.openSettings();
    cy.closeSettings();

    // Scan all rendered buttons: any button without visible text must expose
    // an accessible name via aria-label or title.
    cy.document().then((doc) => {
      const iconless = Array.from(doc.querySelectorAll('button')).filter((button) => {
        if (button.getAttribute('aria-label')) return false;
        if (button.getAttribute('title')) return false;
        if (button.textContent && button.textContent.trim().length > 0) return false;
        return true;
      });
      expect(iconless, `icon-only buttons without a name: ${iconless.map((b) => b.outerHTML.slice(0, 80)).join(' | ')}`)
        .to.have.length(0);
    });
  });

  it('keeps a visible focus ring defined for keyboard navigation', () => {
    // The design system's global focus-visible ring rule must be loaded.
    cy.document().then((doc) => {
      const hasFocusVisibleRule = Array.from(doc.styleSheets).some((sheet) => {
        try {
          return Array.from(sheet.cssRules).some((rule) =>
            (rule as CSSStyleRule).selectorText?.includes(':focus-visible')
          );
        } catch {
          return false; // cross-origin stylesheet, not readable
        }
      });
      expect(hasFocusVisibleRule, 'a :focus-visible outline rule should exist').to.equal(true);
    });
  });

  it('help and settings controls expose aria state', () => {
    const help = cy.get('button[aria-label="Help menu"]');
    help.should('have.attr', 'aria-haspopup', 'menu');
    help.should('have.attr', 'aria-expanded', 'false');

    help.click();
    cy.get('button[aria-label="Help menu"]').should('have.attr', 'aria-expanded', 'true');
  });

  describe('mobile viewport', () => {
    beforeEach(() => {
      cy.viewport(480, 800);
    });

    it('collapses desktop actions into a menu', () => {
      cy.uploadImages([FIXTURE_IMAGES.fullExif]);

      // Desktop action bar is hidden below the lg breakpoint.
      cy.get('header').contains('button', 'Import').should('not.be.visible');
      cy.get('header').contains('button', 'Map View').should('not.be.visible');

      // The hamburger menu carries the navigation instead.
      cy.get('button[aria-label="Open menu"]').should('be.visible').click();
      cy.get('button[aria-label="Close menu"]').should('be.visible');
      cy.get('[data-testid="mobile-menu"]').should('contain.text', 'Map View')
        .and('contain.text', 'List View')
        .and('contain.text', 'Investigation')
        .and('contain.text', 'Export')
        .and('contain.text', 'Settings');

      cy.get('button[aria-label="Close menu"]').click();
      cy.get('button[aria-label="Open menu"]').should('be.visible');
    });

    it('switches views from the mobile menu', () => {
      cy.uploadImages([FIXTURE_IMAGES.fullExif]);

      cy.get('button[aria-label="Open menu"]').click();
      // Both desktop and mobile navigation buttons are in the DOM; choose the
      // visible mobile menu entry at this viewport.
      cy.get('button:visible').contains('List View').click();

      // Menu closed and the selected view rendered.
      cy.get('button[aria-label="Open menu"]').should('be.visible');
      cy.contains('h2', 'Image Details').should('be.visible');
    });

    it('still renders the map full-width', () => {
      cy.uploadImages([FIXTURE_IMAGES.fullExif]);
      cy.get('.leaflet-container').should('be.visible');
    });
  });
});
