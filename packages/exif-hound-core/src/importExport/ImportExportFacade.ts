export { parseImportData, type ImportedData, type ImportedPoint } from './importData';
export { generateCsv, downloadCsv } from './csvExport';
export { generateJson, downloadJson } from './jsonExport';

import { parseImportData } from './importData';
import { generateCsv, downloadCsv } from './csvExport';
import { generateJson, downloadJson } from './jsonExport';

export class ImportExportFacade {
  parseImportData = parseImportData;
  generateCsv = generateCsv;
  downloadCsv = downloadCsv;
  generateJson = generateJson;
  downloadJson = downloadJson;
}
