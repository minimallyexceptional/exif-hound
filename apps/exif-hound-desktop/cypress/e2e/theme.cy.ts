/// <reference types="cypress" />

describe('Theming', () => {
  function appBackground() {
    return cy.get('body').invoke('css', 'background-color');
  }

  it('boots dark by default with data-theme on <html>', () => {
    cy.bootApp();

    cy.get('html').should('have.attr', 'data-theme', 'dark');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('theme')).to.equal('dark');
    });
  });

  it('toggles to light and back via the header control', () => {
    cy.bootApp();

    cy.get('button[aria-label="Switch to light mode"]').click();
    cy.get('html').should('have.attr', 'data-theme', 'light');
    cy.get('button[aria-label="Switch to dark mode"]').should('be.visible');

    // The design tokens invert: --app-black becomes the light-theme value.
    cy.window().then((win) => {
      const styles = win.getComputedStyle(win.document.documentElement);
      expect(styles.getPropertyValue('--app-black').trim().toLowerCase()).to.equal('#ffffff');
      expect(win.localStorage.getItem('theme')).to.equal('light');
    });

    cy.get('button[aria-label="Switch to dark mode"]').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
  });

  it('persists the chosen theme across reloads', () => {
    cy.bootApp();

    cy.get('button[aria-label="Switch to light mode"]').click();
    cy.get('html').should('have.attr', 'data-theme', 'light');

    cy.reload();
    cy.get('h1').contains('Exif Hound');
    cy.get('html').should('have.attr', 'data-theme', 'light');
  });

  it('boots with a seeded theme', () => {
    cy.bootApp({ localStorage: { theme: 'light' } });
    cy.get('html').should('have.attr', 'data-theme', 'light');
    cy.get('button[aria-label="Switch to dark mode"]').should('be.visible');
  });

  it('visibly changes the app background', () => {
    cy.bootApp();
    let darkBackground: string;
    appBackground().then((bg) => {
      darkBackground = bg;
      cy.get('button[aria-label="Switch to light mode"]').click();
      appBackground().then((lightBg) => {
        expect(lightBg).to.not.equal(darkBackground);
      });
    });
  });
});
