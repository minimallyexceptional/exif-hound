import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExifDetailsPanel } from '../ExifDetailsPanel';
import type { ImageData } from '../../types';

jest.mock('../ExifPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="exif-panel-body">panel body</div>,
}));

const image: ImageData = {
  id: 'img-1',
  url: 'blob:x',
  file: { name: 'shot.jpg', type: 'image/jpeg', size: 1, lastModified: 0 },
  exif: {},
};

describe('ExifDetailsPanel', () => {
  it('renders collapsed on the map even when no image is selected', () => {
    render(
      <ExifDetailsPanel
        collapsed
        image={null}
        onToggle={jest.fn()}
        onShowComparison={jest.fn()}
      />
    );

    const toggle = screen.getByTestId('exif-details-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('heading', { name: 'Details' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('exif-panel-body')).not.toBeInTheDocument();
  });

  it('keeps the details body unmounted while the rail is collapsed', () => {
    render(
      <ExifDetailsPanel
        collapsed
        image={image}
        onToggle={jest.fn()}
        onShowComparison={jest.fn()}
      />
    );

    expect(screen.getByTestId('exif-details-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('exif-panel-body')).not.toBeInTheDocument();
  });

  it('shows details when expanded after an image is selected', () => {
    render(
      <ExifDetailsPanel
        collapsed={false}
        image={image}
        onToggle={jest.fn()}
        onShowComparison={jest.fn()}
      />
    );

    expect(screen.getByTestId('exif-details-toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByTestId('exif-panel-body')).toBeInTheDocument();
  });

  it('calls onToggle from the collapsed rail', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();
    render(
      <ExifDetailsPanel
        collapsed
        image={null}
        onToggle={onToggle}
        onShowComparison={jest.fn()}
      />
    );

    await user.click(screen.getByTestId('exif-details-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
