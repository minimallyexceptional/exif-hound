import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { AppToaster } from '../AppToaster';

const toasterProps = jest.fn();

jest.mock('sonner', () => ({
  Toaster: (props: unknown) => {
    toasterProps(props);
    return null;
  },
}));

describe('AppToaster', () => {
  it('anchors every toast in the bottom-right corner', () => {
    render(
      <ThemeProvider>
        <AppToaster />
      </ThemeProvider>
    );

    expect(toasterProps).toHaveBeenCalledWith(expect.objectContaining({
      position: 'bottom-right',
    }));
  });
});
