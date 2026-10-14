import { ExifMiddleware, ExifReaderTagLoader, extractExifData, loadExifReaderTags, type ExifTagLoader } from '../src';

describe('ExifTagLoader port', () => {
  const loader: ExifTagLoader = {
    loadFlat: () =>
      ({
        Make: { description: 'PortCam', value: 'PortCam' },
        Model: { description: 'P-1', value: 'P-1' },
      }) as ReturnType<ExifTagLoader['loadFlat']>,
    loadExpanded: () =>
      ({
        gps: { Latitude: 10.5, Longitude: -20.25 },
      }) as ReturnType<ExifTagLoader['loadExpanded']>,
  };

  it('loadExifReaderTags uses injected loader', () => {
    const tags = loadExifReaderTags(new ArrayBuffer(8), { tagLoader: loader }) as ReturnType<
      ExifTagLoader['loadFlat']
    >;
    expect(tags.Make?.description).toBe('PortCam');
  });

  it('extractExifData uses injected loader for flat and expanded GPS', async () => {
    const metadata = await extractExifData(new ArrayBuffer(8), { tagLoader: loader });
    expect(metadata.make).toBe('PortCam');
    expect(metadata.model).toBe('P-1');
    expect(metadata.latitude).toBe(10.5);
    expect(metadata.longitude).toBe(-20.25);
  });

  it('ExifMiddleware binds loader for the instance lifetime', async () => {
    const middleware = new ExifMiddleware({ tagLoader: loader });
    await expect(middleware.extractExifData(new ArrayBuffer(4))).resolves.toMatchObject({
      make: 'PortCam',
      latitude: 10.5,
    });
    const tags = middleware.loadExifReaderTags(new ArrayBuffer(4)) as ReturnType<ExifTagLoader['loadFlat']>;
    expect(tags.Make?.description).toBe('PortCam');
  });

  it('ExifReaderTagLoader is the default implementation', () => {
    expect(new ExifReaderTagLoader()).toBeDefined();
  });
});
