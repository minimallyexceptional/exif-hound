import {
  resolveFeedUrl,
  getUpdateConfiguration,
  UPDATE_FEED_BASE_URL,
  Edition,
  UpdateChannel,
} from '../UpdateConfiguration';

describe('UpdateConfiguration', () => {
  describe('resolveFeedUrl', () => {
    it('separates Community and Pro feeds', () => {
      expect(resolveFeedUrl('community', 'stable')).toBe(
        'https://updates.exifhound.com/community/stable/latest.json'
      );
      expect(resolveFeedUrl('pro', 'stable')).toBe(
        'https://updates.exifhound.com/pro/stable/latest.json'
      );
    });

    it('supports beta and internal channels without code changes', () => {
      expect(resolveFeedUrl('community', 'beta')).toBe(
        'https://updates.exifhound.com/community/beta/latest.json'
      );
      expect(resolveFeedUrl('pro', 'internal')).toBe(
        'https://updates.exifhound.com/pro/internal/latest.json'
      );
    });

    it('never points an edition at the other edition’s feed', () => {
      const community: string = resolveFeedUrl('community', 'stable');
      const pro: string = resolveFeedUrl('pro', 'stable');
      expect(community).not.toContain('/pro/');
      expect(pro).not.toContain('/community/');
      expect(community.startsWith('https://')).toBe(true);
      expect(UPDATE_FEED_BASE_URL).toBe('https://updates.exifhound.com');
    });

    it.each([
      'community',
      'pro',
    ] as Edition[])('uses only the update namespace for %s', edition => {
      (['stable', 'beta', 'internal'] as UpdateChannel[]).forEach(channel => {
        const url = resolveFeedUrl(edition, channel);
        expect(url).toMatch(new RegExp(`^https://updates\\.exifhound\\.com/${edition}/${channel}/latest\\.json$`));
      });
    });
  });

  describe('getUpdateConfiguration', () => {
    it('returns the build-time configuration', () => {
      const config = getUpdateConfiguration();
      expect(['community', 'pro']).toContain(config.edition);
      expect(['stable', 'beta', 'internal']).toContain(config.channel);
      expect(config.feedUrl).toBe(resolveFeedUrl(config.edition, config.channel));
    });

    it('maps editions to display names', () => {
      expect(getUpdateConfiguration('community', 'stable').appName).toBe('Exif Hound Community');
      expect(getUpdateConfiguration('pro', 'stable').appName).toBe('Exif Hound Pro');
    });
  });
});