import type { DatabaseEngineProvider } from 'investigation-archive';

let providerFactory: (() => Promise<DatabaseEngineProvider>) | null = null;

export function registerArchiveDbProviderFactory(factory: () => Promise<DatabaseEngineProvider>): void {
  providerFactory = factory;
}

export function getArchiveDbProvider(): Promise<DatabaseEngineProvider> {
  if (!providerFactory) {
    throw new Error('Archive DB provider is not registered. Pass getArchiveDbProvider to createDesktopCore.');
  }
  return providerFactory();
}
