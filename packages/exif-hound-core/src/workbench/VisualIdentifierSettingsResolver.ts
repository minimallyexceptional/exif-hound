import { DEFAULT_IDENTIFIER_FAMILIES } from './workbenchCatalog';

export interface VisualIdentifierNodeSettings {
  language?: unknown;
  enabledFamilies?: unknown;
  licensePlateProfile?: unknown;
}

export interface ResolvedVisualIdentifierSettings {
  language: string;
  enabledFamilies: string;
  licensePlateProfile: 'us-general' | null;
}

/** Maps inspector checkbox state to detector settings (license plate profile rules). */
export class VisualIdentifierSettingsResolver {
  resolve(settings: VisualIdentifierNodeSettings): ResolvedVisualIdentifierSettings {
    const enabledFamilies = String(settings.enabledFamilies ?? DEFAULT_IDENTIFIER_FAMILIES);
    const licensePlateProfile = settings.licensePlateProfile === 'off' || settings.licensePlateProfile === ''
      ? null
      : settings.licensePlateProfile === 'us-general'
        || enabledFamilies.split(',').includes('license-plate-like')
        || settings.licensePlateProfile == null
        ? 'us-general'
        : null;

    return {
      language: String(settings.language ?? 'eng'),
      enabledFamilies,
      licensePlateProfile,
    };
  }

  isFamilyEnabled(settings: VisualIdentifierNodeSettings, familyId: string): boolean {
    if (familyId === 'license-plate-like') {
      return settings.licensePlateProfile !== 'off';
    }
    const families = String(settings.enabledFamilies ?? DEFAULT_IDENTIFIER_FAMILIES).split(',');
    return families.includes(familyId);
  }

  toggleFamily(
    settings: VisualIdentifierNodeSettings,
    familyId: string,
    enabled: boolean,
  ): VisualIdentifierNodeSettings {
    const current = new Set(String(settings.enabledFamilies ?? DEFAULT_IDENTIFIER_FAMILIES).split(',').filter(Boolean));
    if (enabled) current.add(familyId);
    else current.delete(familyId);
    return {
      ...settings,
      enabledFamilies: Array.from(current).join(','),
      licensePlateProfile: current.has('license-plate-like') ? 'us-general' : 'off',
    };
  }
}
