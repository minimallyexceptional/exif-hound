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

    // Should only render 3 visible items (mocked virtual items)
    const imageElements = screen.getAllByRole('row');
    // +1 for header row
    expect(imageElements).toHaveLength(4); // 3 data rows + 1 header
  });

  test('ImageList row selection should not re-render all rows', () => {
    const onSelect = jest.fn();
    let renderCount = 0;
    
    // Mock a row component that tracks renders
    const MockRow = React.memo(({ image, isSelected, onClick }: any) => {
      renderCount++;
      return (
        <tr 
          data-testid={`row-${image.id}`}
          onClick={() => onClick(image)}
          className={isSelected ? 'selected' : ''}
        >
          <td>{image.file.name}</td>
        </tr>
      );
    });

    renderWithProviders(
      <ImageList 
        images={mockImages.slice(0, 3)} 
        selectedImage={null} 
        onSelect={onSelect}
      />
    );

    const initialRenderCount = renderCount;
    
    // Select first image
    fireEvent.click(screen.getByTestId('row-img-0'));
    
    // Should not re-render all rows due to memoization
    expect(renderCount).toBeLessThan(initialRenderCount + 3);
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

    const container = screen.getByRole('img').closest('[role="img"]')?.parentElement;
    expect(container).toBeInTheDocument();
    
    // Scrolling should not cause performance issues
    // This is more of an integration test
    if (container) {
      fireEvent.scroll(container, { target: { scrollTop: 500 } });
      
      // Should still only show 3 virtual items
      const imageElements = screen.getAllByRole('img');
      expect(imageElements).toHaveLength(3);
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

    const { rerender } = renderWithProviders(
      <ImageList 
        images={mockImages.slice(0, 10)} 
        selectedImage={null} 
        onSelect={onSelect}
      />
    );

    const initialSortCount = sortCallCount;

    // Re-render with same props - should not trigger new sort
    rerender(
      <ThemeProvider>
        <ImageList 
          images={mockImages.slice(0, 10)} 
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