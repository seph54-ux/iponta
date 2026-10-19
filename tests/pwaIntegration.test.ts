import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Progressive Web App (PWA) Integration & Verification', () => {
  const rootDir = path.resolve(__dirname, '..');
  const manifestPath = path.join(rootDir, 'public', 'manifest.json');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');

  it('validates public/manifest.json meets all PWA standards', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(content.id).toBe('/');
    expect(content.start_url).toBe('/');
    expect(content.scope).toBe('/');
    expect(content.display).toBe('standalone');
    expect(content.name).toContain('IponTa');
    expect(content.short_name).toBe('IponTa');
    expect(content.short_name.length).toBeLessThanOrEqual(12);
    expect(content.theme_color).toBe('#047857');
    expect(content.background_color).toBe('#FAF8F5');

    // Verify icons
    expect(Array.isArray(content.icons)).toBe(true);
    const has192 = content.icons.some((i: any) => i.sizes === '192x192' && i.purpose === 'any');
    const has512 = content.icons.some((i: any) => i.sizes === '512x512' && i.purpose === 'any');
    const hasMaskable = content.icons.some((i: any) => i.sizes === '512x512' && i.purpose === 'maskable');

    expect(has192).toBe(true);
    expect(has512).toBe(true);
    expect(hasMaskable).toBe(true);
  });

  it('confirms all required PWA icon asset files exist in public directory with valid non-zero content', () => {
    const iconFiles = [
      'pwa-192x192.png',
      'pwa-512x512.png',
      'pwa-maskable-512x512.png',
      'apple-touch-icon.png',
      'icon.svg',
      'favicon.ico',
    ];

    for (const file of iconFiles) {
      const filePath = path.join(rootDir, 'public', file);
      expect(fs.existsSync(filePath), `Icon file ${file} must exist`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size, `Icon file ${file} must not be empty`).toBeGreaterThan(100);
    }
  });

  it('validates index.html includes Apple touch icon, manifest link and PWA mobile capabilities', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('href="/manifest.json"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('href="/apple-touch-icon.png"');
    expect(html).toContain('name="mobile-web-app-capable"');
    expect(html).toContain('name="apple-mobile-web-app-capable"');
    expect(html).toContain('name="theme-color"');
  });

  it('confirms VitePWA plugin is configured with devOptions.enabled: true', () => {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
    expect(viteConfig).toContain('VitePWA(');
    expect(viteConfig).toContain("registerType: 'autoUpdate'");
    expect(viteConfig).toContain('devOptions: {');
    expect(viteConfig).toContain('enabled: true');
  });

  it('verifies Sidebar includes PWAInstallButton right above the Policies & Legal T&C button', () => {
    const sidebarPath = path.join(rootDir, 'src', 'components', 'Sidebar.tsx');
    const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

    expect(sidebarContent).toContain('PWAInstallButton');
    const installIndex = sidebarContent.indexOf('<PWAInstallButton');
    const policiesIndex = sidebarContent.indexOf('Policies & Legal T&C');
    expect(installIndex).toBeGreaterThan(0);
    expect(policiesIndex).toBeGreaterThan(installIndex);
  });
});
