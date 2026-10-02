import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageList from '../../components/ImageList';
import ImageGallery from '../../components/ImageGallery';
import { ImageData } from '../../types';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock react-virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { index: 0, start: 0, size: 100, key: '0' },
      { index: 1, start: 100, size: 100, key: '1' },
      { index: 2, start: 200, size: 100, key: '2' }
    ],
    getTotalSize: () => 1000,
    scrollToIndex: jest.fn(),
    measureElement: jest.fn()
  })
}));

const createMockImage = (id: string, name: string): ImageData => ({
  id,
  file: {
    name,
    size: 1000000,
    type: 'image/jpeg',
    lastModified: Date.now()
  } as File,
  url: `mock-url-${id}`,
  exif: {
    dateTimeOriginal: '2023-01-01T12:00:00.000Z',
    make: 'Test Camera',
    model: 'Model X',
    latitude: 40.7128,
    longitude: -74.0060
  }
});

const mockImages = Array.from({ length: 1000 }, (_, i) => 
  createMockImage(`img-${i}`, `test-image-${i}.jpg`)
);

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('Virtualization Performance', () => {
  test('ImageList should only render visible rows', () => {
    const onSelect = jest.fn();
    
    renderWithProviders(
      <ImageList 
        images={mockImages} 
        selectedImage={null} 
        onSelect={onSelect}
      />
    );

    // Should only render 3 visible items (mocked virtual items):
    // 1 header row + 3 data rows, all flat (role="row")
    const imageElements = screen.getAllByRole('row');
    expect(imageElements).toHaveLength(4);
  });

  test('ImageList row selection should trigger selection callback', () => {
    const onSelect = jest.fn();
    
    renderWithProviders(
      <ImageList 
        images={mockImages.slice(0, 3)} 
        selectedImage={null} 
        onSelect={onSelect}
      />
    );
    
    // Click the first data row (flat grid row with an onClick handler)
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows.find(row => row.textContent?.includes('test-image-0.jpg'));
    expect(firstDataRow).toBeTruthy();
    fireEvent.click(firstDataRow!);
    
    // Selecting a row must notify the parent
    expect(onSelect).toHaveBeenCalled();
  });

  test('ImageGallery should only render visible items', () => {
    const onSelect = jest.fn();
    
    renderWithProviders(
      <ImageGallery 
        images={mockImages} 
        selectedImage={null} 
        onSelect={onSelect}
      />
    );

    // Should only render 3 visible items (mocked virtual items)
    const imageElements = screen.getAllByRole('img');
    expect(imageElements).toHaveLength(3);
  });

  test('ImageGallery should handle scroll performance', () => {
    const onSelect = jest.fn();
    
    renderWithProviders(
      <ImageGallery 
        images={mockImages} 
        selectedImage={null} 
        onSelect={onSelect}
      />
    );

    const img = screen.getAllByRole('img')[0];
    expect(img).toBeInTheDocument();
    
    // Scrolling should not cause performance issues
    // This is more of an integration test
    const container = img.closest('div');
    if (container) {
      fireEvent.scroll(container, { target: { scrollTop: 500 } });
      
      // Should still only render a virtualized subset after scrolling
      const imageElements = screen.getAllByRole('img');
      expect(imageElements.length).toBeGreaterThan(0);
      expect(imageElements.length).toBeLessThan(mockImages.length);
    }
  });

  test('ImageList sorting should be memoized', () => {
    const onSelect = jest.fn();
    let sortCallCount = 0;
    
    // Mock the sort function to track calls
    const originalSort = Array.prototype.sort;
    Array.prototype.sort = function(...args) {
      sortCallCount++;
      return originalSort.apply(this, args);
    };

    // Keep a stable array reference so the memoized sort is not invalidated
    const images = mockImages.slice(0, 10);

    const { rerender } = renderWithProviders(
      <ImageList 
        images={images} 
        selectedImage={null} 
        onSelect={onSelect}
      />
    );

    const initialSortCount = sortCallCount;

    // Re-render with same props - should not trigger new sort
    rerender(
      <ThemeProvider>
        <ImageList 
          images={images} 
          selectedImage={null} 
          onSelect={onSelect}
        />
      </ThemeProvider>
    );

    // Sort should be memoized
    expect(sortCallCount).toBe(initialSortCount);

    // Restore original sort
    Array.prototype.sort = originalSort;
  });
});
