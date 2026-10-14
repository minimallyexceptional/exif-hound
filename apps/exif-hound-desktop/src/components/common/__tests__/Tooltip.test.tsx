import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renders into document.body so overflow ancestors cannot clip it', async () => {
    const { container } = render(
      <div data-testid="clipper" style={{ overflow: 'hidden', height: 24, width: 48 }}>
        <Tooltip content="Save a reusable copy of this workflow on this machine">
          <button type="button">Save</button>
        </Tooltip>
      </div>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Save' }));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Save a reusable copy of this workflow on this machine');
    expect(container.querySelector('[data-testid="clipper"]')?.contains(tooltip)).toBe(false);
    expect(document.body.contains(tooltip)).toBe(true);
  });

  it('measures the trigger before becoming visible so it does not flash at 0,0', async () => {
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 200, left: 400, right: 480, bottom: 232, width: 80, height: 32, x: 400, y: 200, toJSON: () => undefined,
    } as DOMRect);
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 160 });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 32 });

    render(
      <Tooltip content="Save a reusable copy of this workflow on this machine">
        <button type="button">Save</button>
      </Tooltip>,
    );

    fireEvent.focus(screen.getByRole('button', { name: 'Save' }));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).not.toHaveClass('invisible');
    expect(tooltip.style.top).toBe('160px');
    expect(tooltip.style.left).toBe('360px');
  });

  it('dismisses on Escape and when focus leaves', async () => {
    render(
      <Tooltip content="Process each connected node">
        <button type="button">Run Workflow</button>
      </Tooltip>,
    );

    const button = screen.getByRole('button', { name: 'Run Workflow' });
    fireEvent.focus(button);
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
