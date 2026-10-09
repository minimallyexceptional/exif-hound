export function validateWorkflowName(name: string): string | null {
  if (!name || name.trim() !== name || name === '.' || name === '..') return 'Enter a workflow name without leading or trailing spaces.';
  if (Array.from(name).some((character) => {
    const point = character.codePointAt(0)!;
    return point < 32 || point === 127 || '<>:"/\\|?*'.includes(character);
  })) return 'Workflow name contains characters that are not supported on all platforms.';
  if (/[. ]$/u.test(name)) return 'Workflow names cannot end with a dot or space.';
  const deviceName = name.split('.')[0].toUpperCase();
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/u.test(deviceName)) return 'Workflow name is reserved by a supported operating system.';
  return null;
}

export function normalizeWorkflowName(name: string): string {
  return name.normalize('NFC').toLocaleLowerCase('en-US');
}
