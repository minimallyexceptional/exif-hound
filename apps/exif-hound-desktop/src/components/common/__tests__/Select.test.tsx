import { fireEvent, render, screen, within } from '@testing-library/react';
import { Select } from '../Select';

describe('Select', () => {
  it('applies shared app-control select classes for block and compact variants', () => {
    const { rerender } = render(
      <Select aria-label="Workflow">
        <option value="a">Alpha</option>
      </Select>,
    );
    const block = screen.getByRole('combobox', { name: 'Workflow' });
    expect(block.className).toContain('app-control');
    expect(block.className).toContain('app-control-select');
    expect(block.className).toContain('app-control-block');

    rerender(
      <Select compact aria-label="Workflow compact">
        <option value="a">Alpha</option>
      </Select>,
    );
    const compact = screen.getByRole('combobox', { name: 'Workflow compact' });
    expect(compact.className).toContain('app-control-select-compact');
    expect(compact.className).not.toContain('app-control-block');
  });

  it('opens a listbox that matches the trigger surface with a white selected row', () => {
    render(
      <Select aria-label="Pick one" defaultValue="b">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </Select>,
    );
    fireEvent.click(screen.getByRole('combobox', { name: 'Pick one' }));
    const listbox = screen.getByRole('listbox', { name: 'Pick one' });
    expect(listbox).toHaveClass('app-select-menu');
    const beta = within(listbox).getByRole('option', { name: 'Beta' });
    expect(beta).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(within(listbox).getByRole('option', { name: 'Alpha' }));
    expect(screen.getByRole('combobox', { name: 'Pick one' })).toHaveAttribute('data-value', 'a');
  });
});
