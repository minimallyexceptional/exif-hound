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
        'https://updates.exifhound.com/stable/latest.json'
      );
    });

    it('supports beta and internal channels without code changes', () => {
      expect(resolveFeedUrl('beta')).toBe(
        'https://updates.exifhound.com/beta/latest.json'
      );
      expect(resolveFeedUrl('internal')).toBe(
        'https://updates.exifhound.com/internal/latest.json'
      );
    });

    it('uses the single app namespace', () => {
      const stable = resolveFeedUrl('stable');
      expect(stable).not.toContain('/pro/');
      expect(stable).not.toContain('/community/');
      expect(stable.startsWith('https://')).toBe(true);
      expect(UPDATE_FEED_BASE_URL).toBe('https://updates.exifhound.com');
    });

    it.each(['stable', 'beta', 'internal'] as UpdateChannel[])('uses the update namespace for %s', channel => {
      const url = resolveFeedUrl(channel);
      expect(url).toBe(`https://updates.exifhound.com/${channel}/latest.json`);
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
