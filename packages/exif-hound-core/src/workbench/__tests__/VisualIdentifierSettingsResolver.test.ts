import { VisualIdentifierSettingsResolver } from '../VisualIdentifierSettingsResolver';

describe('VisualIdentifierSettingsResolver', () => {
  const resolver = new VisualIdentifierSettingsResolver();

  it('enables us-general plate profile when license plates are on', () => {
    const resolved = resolver.resolve({ enabledFamilies: 'email,license-plate-like', language: 'eng' });
    expect(resolved.licensePlateProfile).toBe('us-general');
  });

  it('turns license plate profile off when family is toggled off', () => {
    const next = resolver.toggleFamily({ enabledFamilies: 'license-plate-like', licensePlateProfile: 'us-general' }, 'license-plate-like', false);
    expect(next.licensePlateProfile).toBe('off');
    expect(next.enabledFamilies).not.toContain('license-plate-like');
  });
});
