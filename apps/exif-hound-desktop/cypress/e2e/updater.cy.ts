/// <reference types="cypress" />

import { MOCK_UPDATE } from '../support/app';

describe('Updater', () => {
  it('is silent when the automatic check finds no update', () => {
    // Standard boot registers plugin:updater|check -> null (up to date).
    cy.bootApp();

    // The app shell is the only surface; no update dialogs appear.
    cy.get('h1').contains('Exif Hound');
    cy.contains('Update Available').should('not.exist');
  });

  it('shows the update-available dialog when the check finds an update', () => {
    cy.bootApp({
      commands: { 'plugin:updater|check': MOCK_UPDATE },
    });

    // Trigger a user-initiated check through the help menu.
    cy.get('button[aria-label="Help menu"]').click();
    cy.get('#help-menu').contains('Check for Updates').click();

    // Settings opens (manual check surface) and the global dialog appears.
    cy.contains('Update Available').should('be.visible');
    cy.get('[role="dialog"]')
      .should('contain.text', 'Exif Hound 9.9.9 is available.')
      .and('contain.text', 'Automated test release notes');
    cy.get('[data-testid="update-status"]').should('contain.text', 'An update is available.');
  });

  it('dismisses the update with "Later" without downloading', () => {
    cy.bootApp({
      commands: { 'plugin:updater|check': MOCK_UPDATE },
    });

    cy.get('button[aria-label="Help menu"]').click();
    cy.get('#help-menu').contains('Check for Updates').click();
    cy.contains('Update Available').should('be.visible');

    // The updater must not have attempted a download or relaunch.
    cy.window().then((win) => {
      const calls = win.__tauriMock.calls;
      expect(calls).to.not.include('plugin:updater|download');
      expect(calls).to.not.include('plugin:process|relaunch');
    });

    cy.contains('button', 'Later').click();
    cy.contains('Update Available').should('not.exist');
  });

  it('reports an update failure gracefully on the manual check', () => {
    cy.bootApp({
      commands: { 'plugin:updater|check': new Error('mock updater outage') },
    });

    cy.openSettings();
    cy.contains('button', 'Check for Updates').click();

    // The manual check surfaces a readable error instead of crashing.
    cy.get('[data-testid="update-status"]').should(($el) => {
      expect($el.text()).to.not.equal('Checking…');
    });
    cy.contains('button', 'Check for Updates').should('exist');
  });
});
