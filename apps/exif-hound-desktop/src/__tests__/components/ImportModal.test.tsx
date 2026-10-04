import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ImportModal from '../../components/ImportModal';

function uploadKml(contents: string) {
  const input = document.getElementById('fileInput') as HTMLInputElement;
  const file = {
    name: 'test.kml',
    text: async () => contents,
  };
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  fireEvent.change(input);
}

describe('ImportModal', () => {
  it('keeps the modal open when parseImportData rejects', async () => {
    const onClose = jest.fn();
    const onImport = jest.fn().mockRejectedValue(
      new Error('No KML content was found in the file.')
    );

    render(<ImportModal onClose={onClose} onImport={onImport} />);
    uploadKml('<kml xmlns="http://www.opengis.net/kml/2.2"></kml>');

    await waitFor(() => {
      expect(onImport).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /import location data/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/no kml content was found/i);
  });

  it('closes the modal after a successful import', async () => {
    const onClose = jest.fn();
    const onImport = jest.fn().mockResolvedValue(undefined);

    render(<ImportModal onClose={onClose} onImport={onImport} />);
    uploadKml('<kml xmlns="http://www.opengis.net/kml/2.2"><Placemark><Point><coordinates>-1,52</coordinates></Point></Placemark></kml>');

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
