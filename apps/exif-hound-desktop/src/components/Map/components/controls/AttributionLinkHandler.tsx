import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { openExternalUrl } from '../../../../utils/openExternalUrl';

/**
 * Intercept attribution / map overlay links so they open in the system browser.
 */
export function AttributionLinkHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor?.href || !container.contains(anchor)) {
        return;
      }
      event.preventDefault();
      void openExternalUrl(anchor.href).catch((error: unknown) => {
        if (__DEV__) {
          console.error('Failed to open external URL:', error);
        }
      });
    };

    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [map]);

  return null;
}
