import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../components/AppLayout';

describe('Gallery Sidebar behavior', () => {
  const SidebarStub = () => (
    <div>
      <button aria-label="thumb-1">Thumb 1</button>
    </div>
  );

  function renderLayout(isGalleryCollapsed: boolean, onToggle?: () => void) {
    return render(
      <AppLayout
        showSidebar
        isGalleryCollapsed={isGalleryCollapsed}
        onToggleGallery={onToggle}
        sidebar={<SidebarStub />}
      >
        <div>content</div>
      </AppLayout>
    );
  }

  it('hides sidebar content and prevents interaction when collapsed', async () => {
    const user = userEvent.setup();
    const { rerender } = renderLayout(false);

    // Content visible when expanded
    expect(screen.getByRole('button', { name: /thumb\s?-?1/i })).toBeInTheDocument();

    // Collapse
    rerender(
      <AppLayout
        showSidebar
        isGalleryCollapsed
        onToggleGallery={jest.fn()}
        sidebar={<SidebarStub />}
      >
        <div>content</div>
      </AppLayout>
    );

    // Sidebar toggle button should describe state
    const toggle = screen.getByRole('button', { name: /expand gallery/i });
    expect(toggle).toBeInTheDocument();

    // Sidebar content should not be visible or accessible
    expect(screen.queryByRole('button', { name: 'Thumb 1' })).toBeNull();

    // Clicking sidebar container should toggle (header click)
    await user.click(toggle);
  });
});
