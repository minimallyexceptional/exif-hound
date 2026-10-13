export * from './index';

import {
  createUpdateService,
  getUpdateService,
  resetUpdateService,
  UpdateService,
} from './index';

export class UpdaterNamespace {
  readonly UpdateService = UpdateService;
  createUpdateService = createUpdateService;
  getUpdateService = getUpdateService;
  resetUpdateService = resetUpdateService;
}
