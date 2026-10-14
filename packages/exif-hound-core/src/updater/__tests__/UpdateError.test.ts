import { mapPluginError, makeUpdateError, UpdateError, UpdateErrorCode } from '../UpdateError';

describe('UpdateError mapping', () => {
  it('maps signature failures to VERIFY_FAILED regardless of operation', () => {
    for (const operation of ['check', 'download', 'install'] as const) {
      const error = mapPluginError(new Error('signature verification failed: bad signature'), operation);
      expect(error.code).toBe(UpdateErrorCode.VerifyFailed);
      expect(error.userMessage).toContain('security verification');
    }
  });

  it('maps minisign/public key wording to VERIFY_FAILED', () => {
    const error = mapPluginError(new Error('minisign: signature not valid for public key'), 'download');
    expect(error.code).toBe(UpdateErrorCode.VerifyFailed);
  });

  it('maps check errors to CHECK_FAILED with a non-technical message', () => {
    const error = mapPluginError(new Error('connection refused'), 'check');
    expect(error.code).toBe(UpdateErrorCode.CheckFailed);
    expect(error.userMessage).toBe(
      'Unable to check for updates. Please verify your internet connection and try again.'
    );
  });

  it('maps download errors to DOWNLOAD_FAILED', () => {
    const error = mapPluginError(new Error('network interrupted'), 'download');
    expect(error.code).toBe(UpdateErrorCode.DownloadFailed);
  });

  it('maps install errors to INSTALL_FAILED', () => {
    const error = mapPluginError(new Error('installer exited with code 1'), 'install');
    expect(error.code).toBe(UpdateErrorCode.InstallFailed);
    expect(error.userMessage).toContain('installation of EXIF Hound is unchanged');
  });

  it('distinguishes relaunch failures after a successful installation', () => {
    const error = mapPluginError(new Error('relaunch failed'), 'relaunch');
    expect(error.code).toBe(UpdateErrorCode.RelaunchFailed);
    expect(error.userMessage).toContain('was installed');
  });

  it('preserves the cause for diagnostics', () => {
    const cause = new Error('ECONNRESET');
    const error = makeUpdateError(UpdateErrorCode.DownloadFailed, cause);
    expect((error as unknown as { cause?: unknown }).cause).toBe(cause);
  });

  it('is an Error subclass with a descriptive message', () => {
    const error = makeUpdateError(UpdateErrorCode.CheckFailed);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UpdateError);
    expect(error.message).toContain(UpdateErrorCode.CheckFailed);
  });
});
