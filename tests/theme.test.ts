import { describe, it, expect, beforeEach } from 'vitest';

describe('Theme Mode Logic & Persistence', () => {
  let mockStorage: Record<string, string> = {};
  let mockClasses: Set<string> = new Set();

  beforeEach(() => {
    mockStorage = {};
    mockClasses = new Set();
  });

  const getStoredTheme = () => {
    const saved = mockStorage['iponta_dark_mode'] ?? mockStorage['balanse_ph_dark_mode'];
    if (saved !== undefined && saved !== null) {
      return saved === 'true';
    }
    return true; // Night mode default
  };

  const applyTheme = (isDark: boolean) => {
    mockStorage['iponta_dark_mode'] = isDark ? 'true' : 'false';
    if (isDark) {
      mockClasses.add('dark');
    } else {
      mockClasses.delete('dark');
    }
  };

  it('defaults to dark mode (night mode) when no setting is saved', () => {
    expect(getStoredTheme()).toBe(true);
  });

  it('correctly toggles to daylight mode (light mode) and removes dark class', () => {
    applyTheme(false);
    expect(mockStorage['iponta_dark_mode']).toBe('false');
    expect(mockClasses.has('dark')).toBe(false);
    expect(getStoredTheme()).toBe(false);
  });

  it('correctly toggles to midnight slate (dark mode) and adds dark class', () => {
    applyTheme(true);
    expect(mockStorage['iponta_dark_mode']).toBe('true');
    expect(mockClasses.has('dark')).toBe(true);
    expect(getStoredTheme()).toBe(true);
  });

  it('honors legacy balanse_ph_dark_mode when iponta_dark_mode is not yet initialized', () => {
    mockStorage['balanse_ph_dark_mode'] = 'false';
    expect(getStoredTheme()).toBe(false);

    mockStorage['balanse_ph_dark_mode'] = 'true';
    expect(getStoredTheme()).toBe(true);
  });

  it('prioritizes iponta_dark_mode over legacy key once updated', () => {
    mockStorage['balanse_ph_dark_mode'] = 'true';
    mockStorage['iponta_dark_mode'] = 'false';
    expect(getStoredTheme()).toBe(false);
  });
});
