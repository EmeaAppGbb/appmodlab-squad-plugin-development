import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { DbMigrationCheckerPlugin } from './index';

describe('DbMigrationCheckerPlugin', () => {
  const plugin = new DbMigrationCheckerPlugin();

  describe('init()', () => {
    it('returns correct metadata', async () => {
      const result = await plugin.init();
      expect(result.name).toBe('db-migration-checker');
      expect(result.version).toBe('1.0.0');
      expect(result.skills).toHaveLength(1);
    });
  });

  describe('getSkills()', () => {
    it('returns 1 skill with correct name', () => {
      const skills = plugin.getSkills();
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('check-migration-safety');
    });
  });

  describe('checkMigrationSafety()', () => {
    it('detects errors and warnings in test migrations', async () => {
      const migrationsDir = path.resolve(__dirname, '../../..', 'test-project/prisma/migrations');
      const report = await plugin.checkMigrationSafety(migrationsDir);

      expect(report.safe).toBe(false);

      const errors = report.issues.filter(i => i.severity === 'error');
      const warnings = report.issues.filter(i => i.severity === 'warning');

      // DROP TABLE, DROP COLUMN (matches two rules), TRUNCATE TABLE
      expect(errors.length).toBeGreaterThanOrEqual(3);
      // RENAME, UNIQUE INDEX
      expect(warnings.length).toBeGreaterThanOrEqual(2);

      const snippets = report.issues.map(i => i.snippet);
      expect(snippets.some(s => /DROP\s+TABLE/i.test(s))).toBe(true);
      expect(snippets.some(s => /TRUNCATE/i.test(s))).toBe(true);
      expect(snippets.some(s => /RENAME/i.test(s))).toBe(true);
      expect(snippets.some(s => /UNIQUE\s+INDEX/i.test(s))).toBe(true);
    });

    it('returns safe for empty directory', async () => {
      const report = await plugin.checkMigrationSafety(path.resolve(__dirname, 'nonexistent'));
      expect(report.safe).toBe(true);
      expect(report.issues).toHaveLength(0);
    });
  });

  describe('generateReport()', () => {
    it('produces markdown with errors and warnings sections', async () => {
      const migrationsDir = path.resolve(__dirname, '../../..', 'test-project/prisma/migrations');
      const report = await plugin.checkMigrationSafety(migrationsDir);
      const markdown = plugin.generateReport(report);

      expect(markdown).toContain('## Migration Safety Report');
      expect(markdown).toContain('### ❌ Errors');
      expect(markdown).toContain('### ⚠️ Warnings');
    });

    it('returns safe message when no issues', () => {
      const markdown = plugin.generateReport({ safe: true, issues: [] });
      expect(markdown).toContain('All migrations are safe');
    });
  });
});
