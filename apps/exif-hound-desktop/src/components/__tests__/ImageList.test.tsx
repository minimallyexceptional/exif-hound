import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ImageList from '../ImageList';
import type { ImageData } from '../../types';

function image(partial: Partial<ImageData> & { name: string; exif?: ImageData['exif'] }): ImageData {
  return {
    id: partial.id ?? partial.name,
    url: 'blob:x',
    file: { name: partial.name, type: 'image/jpeg', size: 1, lastModified: 0 },
    exif: partial.exif ?? {},
  };
}

function renderList(images: ImageData[]) {
  return render(
    <div style={{ height: 400 }}>
      <ImageList images={images} selectedImage={null} onSelect={jest.fn()} />
    </div>,
  );
}

function cellFor(fileName: string, headerName: string) {
  const headers = screen.getAllByRole('columnheader');
  const index = headers.findIndex((header) => header.textContent === headerName);
  const row = screen.getByText(fileName).closest('[role="row"]');
  if (!(row instanceof HTMLElement) || index < 0) {
    throw new Error(`missing row or header ${headerName}`);
  }
  return within(row).getAllByRole('gridcell')[index];
}

describe('ImageList GPS columns', () => {
  it('shows GPS headers including Place on a default mount', () => {
    renderList([image({ name: 'a.jpg' })]);
    expect(screen.getByRole('columnheader', { name: 'Place' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Latitude' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Longitude' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Altitude' })).toBeInTheDocument();
  });

  it('shows the formatted place name in Place', () => {
    renderList([image({
      name: 'geo.jpg',
      exif: {
        latitude: 51.5,
        longitude: -0.12,
        location: { formatted: 'Tower Bridge, London', loading: false },
      },
    })]);
    const place = cellFor('geo.jpg', 'Place');
    expect(place).toHaveTextContent('Tower Bridge, London');
    expect(place).toHaveClass('selectable-value');
  });

  it('shows an em dash when place name is missing or empty', () => {
    renderList([
      image({ name: 'none.jpg', exif: { latitude: 1, longitude: 2 } }),
      image({ name: 'empty.jpg', exif: { location: { formatted: '   ', loading: false } } }),
      image({ name: 'loading.jpg', exif: { location: { loading: true } } }),
      image({ name: 'err.jpg', exif: { location: { loading: false, error: 'Failed' } } }),
    ]);
    expect(cellFor('none.jpg', 'Place')).toHaveTextContent('—');
    expect(cellFor('empty.jpg', 'Place')).toHaveTextContent('—');
    expect(cellFor('loading.jpg', 'Place')).toHaveTextContent('—');
    expect(cellFor('err.jpg', 'Place')).toHaveTextContent('—');
  });

  it('restores GPS headers when Reset Columns is used', () => {
    renderList([image({ name: 'a.jpg' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Customize visible columns' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /GPS Data/i }));
    expect(screen.queryByRole('columnheader', { name: 'Place' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset columns to defaults' }));
    expect(screen.getByRole('columnheader', { name: 'Place' })).toBeInTheDocument();
  });
});
