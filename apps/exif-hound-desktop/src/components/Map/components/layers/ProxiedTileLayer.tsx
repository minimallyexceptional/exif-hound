import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchBytesViaRust } from '../../../../utils/rustNetwork';

type Props = {
  url: string;
  attribution: string;
  subdomains?: string[];
};

function createProxiedTileLayer(
  url: string,
  options: L.TileLayerOptions,
): L.TileLayer {
  const ProxiedLayer = L.TileLayer.extend({
    createTile(this: L.TileLayer, coords: L.Coords, done: L.DoneCallback) {
      const tile = document.createElement('img');
      tile.alt = '';
      tile.setAttribute('role', 'presentation');
      const tileUrl = this.getTileUrl(coords);
      void fetchBytesViaRust('fetch_map_tile_bytes', tileUrl)
        .then(bytes => {
          tile.src = URL.createObjectURL(new Blob([Uint8Array.from(bytes)]));
          done(undefined, tile);
        })
        .catch(error => {
          done(error instanceof Error ? error : new Error(String(error)), tile);
        });
      return tile;
    },
  });
  // Leaflet's extend helper returns a constructor with a non-standard signature.
  return new (ProxiedLayer as unknown as new (
    template: string,
    options?: L.TileLayerOptions,
  ) => L.TileLayer)(url, options);
}

/**
 * Fetches custom raster tiles through the Tauri host so CSP img-src stays
 * limited to known map providers; only the configured tile host is registered in Rust.
 */
export function ProxiedTileLayer({ url, attribution, subdomains = [] }: Props) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    const layer = createProxiedTileLayer(url, {
      attribution,
      subdomains,
      maxZoom: 19,
      minZoom: 0,
      detectRetina: true,
    });
    layerRef.current = layer;
    layer.addTo(map);

    const onUnload = (event: L.TileEvent) => {
      const img = event.tile as HTMLImageElement;
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    };
    layer.on('tileunload', onUnload);

    return () => {
      layer.off('tileunload', onUnload);
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, url, attribution, subdomains]);

  return null;
}
