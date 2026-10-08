import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Investigation from '../../components/Investigation';
import { ImageData } from '../../types';

// The deep-analysis tools pull in react-leaflet/visx, which cannot load
// under Jest's CJS runtime; the dashboard tests only need them to mount.
jest.mock('../../components/analysis/DeviceDendrogram', () => () => <div data-testid="pattern-tool" />);
jest.mock('../../components/analysis/TimelineAnalysis', () => () => <div data-testid="timeline-tool" />);
jest.mock('../../components/analysis/SoftwareProcessingAnalysis', () => () => <div data-testid="software-tool" />);
jest.mock('../../components/analysis/GeographicalAnalysis', () => () => <div data-testid="geolocation-tool" />);

function makeImage(overrides: Partial<ImageData['exif']> = {}): ImageData {
  return {
    id: 'img-1',
    url: 'blob:img-1',
    file: { name: 'photo.jpg', type: 'image/jpeg', size: 100, lastModified: 0 },
    exif: {
      latitude: 51.5,
      longitude: -0.1278,
      dateTimeOriginal: '2024:06:15 10:30:00',
      make: 'TestCam',
      model: 'Hound-1',
      ...overrides
    }
  };
}

describe('Investigation dashboard', () => {
  it('renders the dashboard with compiled insight sections', () => {
    render(<Investigation images={[makeImage()]} />);

    expect(screen.getByRole('heading', { name: 'Investigation Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Dataset Overview')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toBeInTheDocument();
    expect(screen.getByText('Timeline of Events')).toBeInTheDocument();
    expect(screen.getByText('Software Processing')).toBeInTheDocument();
    expect(screen.getByText('Anomalies')).toBeInTheDocument();
    expect(screen.getByText('TestCam Hound-1')).toBeInTheDocument();
  });

  it('aggregates coverage metrics across multiple images', () => {
    const images = [
      makeImage(),
      makeImage({ id: undefined, latitude: null, longitude: null, dateTimeOriginal: null } as never)
    ];
    images[1].id = 'img-2';
    render(<Investigation images={images} />);

    expect(screen.getByTestId('overview-total')).toHaveTextContent('2');
    expect(screen.getByTestId('coverage-gps-location')).toHaveTextContent('1/2 · 50%');
    expect(screen.getByText('1 image without GPS data')).toBeInTheDocument();
  });

  it('shows the empty state when no images are loaded', () => {
    render(<Investigation images={[]} />);
    expect(screen.getByText('No images loaded')).toBeInTheDocument();
    expect(screen.queryByText('Dataset Overview')).not.toBeInTheDocument();
  });

  it('drills into a tool from a section card and returns to the dashboard', () => {
    render(<Investigation images={[makeImage()]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    expect(screen.getByRole('heading', { name: 'Timeline Analysis' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'Investigation Dashboard' })).toBeInTheDocument();
  });

  it('exits tool fullscreen with Escape', () => {
    render(<Investigation images={[makeImage()]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Timeline' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }));
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument();
  });
});