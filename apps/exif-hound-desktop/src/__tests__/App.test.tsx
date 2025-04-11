import React from 'react';
import { render, screen } from '@testing-library/react';

// A simple test to make sure Jest is working
describe('Basic Test Suite', () => {
  it('renders without crashing', () => {
    render(<div data-testid="test-element">Jest is working!</div>);
    expect(screen.getByTestId('test-element')).toBeInTheDocument();
    expect(screen.getByText('Jest is working!')).toBeInTheDocument();
  });
}); 