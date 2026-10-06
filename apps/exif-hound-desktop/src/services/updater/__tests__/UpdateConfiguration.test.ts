import {
  resolveFeedUrl,
  getUpdateConfiguration,
  UPDATE_FEED_BASE_URL,
  UpdateChannel,
} from '../UpdateConfiguration';

describe('UpdateConfiguration', () => {
  describe('resolveFeedUrl', () => {
    it('resolves the stable feed', () => {
      expect(resolveFeedUrl('stable')).toBe(
        'https://minimallyexceptional.github.io/exif-hound/stable/latest.json'
      );
    });

    it('supports beta and internal channels without code changes', () => {
      expect(resolveFeedUrl('beta')).toBe(
        'https://minimallyexceptional.github.io/exif-hound/beta/latest.json'
      );
      expect(resolveFeedUrl('internal')).toBe(
        'https://minimallyexceptional.github.io/exif-hound/internal/latest.json'
      );
    });

    it('uses a stable URL for every supported channel', () => {
      for (const channel of ['stable', 'beta', 'internal'] as UpdateChannel[]) {
        expect(resolveFeedUrl(channel)).toBe(
          `https://minimallyexceptional.github.io/exif-hound/${channel}/latest.json`
        );
      }
    });

    it('uses the single app namespace', () => {
      const stable = resolveFeedUrl('stable');
      expect(stable).not.toContain('/pro/');
      expect(stable).not.toContain('/community/');
      expect(stable.startsWith('https://')).toBe(true);
      expect(UPDATE_FEED_BASE_URL).toBe('https://minimallyexceptional.github.io/exif-hound');
    });

    it.each(['stable', 'beta', 'internal'] as UpdateChannel[])('uses the update namespace for %s', channel => {
      const url = resolveFeedUrl(channel);
      expect(url).toBe(
        `https://minimallyexceptional.github.io/exif-hound/${channel}/latest.json`
      );
    });
  });

  describe('getUpdateConfiguration', () => {
    it('returns the build-time configuration', () => {
      const config = getUpdateConfiguration();
      expect(['stable', 'beta', 'internal']).toContain(config.channel);
      expect(config.feedUrl).toBe(resolveFeedUrl(config.channel));
    });

    it('uses the consolidated display name', () => {
      expect(getUpdateConfiguration('stable').appName).toBe('Exif Hound');
    });
  });
});
