import { describe, it, expect } from 'vitest';
import { ChangelogGeneratorPlugin, CommitInfo } from './index';

describe('ChangelogGeneratorPlugin', () => {
  const plugin = new ChangelogGeneratorPlugin();
  const date = new Date('2024-01-01');

  describe('init()', () => {
    it('returns correct metadata', async () => {
      const result = await plugin.init();
      expect(result.name).toBe('changelog-generator');
      expect(result.version).toBe('1.0.0');
      expect(result.skills).toHaveLength(2);
    });
  });

  describe('getSkills()', () => {
    it('returns 2 skills with correct names', () => {
      const skills = plugin.getSkills();
      expect(skills).toHaveLength(2);
      expect(skills[0].name).toBe('generate-changelog');
      expect(skills[1].name).toBe('calculate-version');
    });
  });

  describe('parseCommit()', () => {
    it('parses feat with scope', () => {
      const result = plugin.parseCommit('feat(auth): add login', 'abc123', 'dev', date);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('feat');
      expect(result!.scope).toBe('auth');
      expect(result!.subject).toBe('add login');
      expect(result!.breaking).toBe(false);
    });

    it('parses fix without scope', () => {
      const result = plugin.parseCommit('fix: resolve crash', 'def456', 'dev', date);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('fix');
      expect(result!.scope).toBeUndefined();
      expect(result!.subject).toBe('resolve crash');
    });

    it('detects breaking change with !', () => {
      const result = plugin.parseCommit('feat!: breaking change', 'ghi789', 'dev', date);
      expect(result).not.toBeNull();
      expect(result!.breaking).toBe(true);
    });

    it('returns null for non-conventional message', () => {
      const result = plugin.parseCommit('random message', 'xyz000', 'dev', date);
      expect(result).toBeNull();
    });
  });

  describe('categorizeCommits()', () => {
    it('groups commits by type', () => {
      const commits: CommitInfo[] = [
        { hash: 'a', type: 'feat', subject: 'feature 1', breaking: false, author: 'dev', date },
        { hash: 'b', type: 'feat', subject: 'feature 2', breaking: false, author: 'dev', date },
        { hash: 'c', type: 'fix', subject: 'bugfix', breaking: false, author: 'dev', date },
      ];

      const sections = plugin.categorizeCommits(commits);
      const featSection = sections.find(s => s.title.includes('Features'));
      const fixSection = sections.find(s => s.title.includes('Bug Fixes'));

      expect(featSection).toBeDefined();
      expect(featSection!.commits).toHaveLength(2);
      expect(fixSection).toBeDefined();
      expect(fixSection!.commits).toHaveLength(1);
    });
  });

  describe('calculateNextVersion()', () => {
    it('bumps major on breaking change', () => {
      const commits: CommitInfo[] = [
        { hash: 'a', type: 'feat', subject: 'breaking', breaking: true, author: 'dev', date },
      ];
      const result = plugin.calculateNextVersion('1.0.0', commits);
      expect(result.next).toBe('v2.0.0');
      expect(result.type).toBe('major');
    });

    it('bumps minor on feature', () => {
      const commits: CommitInfo[] = [
        { hash: 'a', type: 'feat', subject: 'new feature', breaking: false, author: 'dev', date },
      ];
      const result = plugin.calculateNextVersion('1.0.0', commits);
      expect(result.next).toBe('v1.1.0');
      expect(result.type).toBe('minor');
    });

    it('bumps patch on fix only', () => {
      const commits: CommitInfo[] = [
        { hash: 'a', type: 'fix', subject: 'bugfix', breaking: false, author: 'dev', date },
      ];
      const result = plugin.calculateNextVersion('1.0.0', commits);
      expect(result.next).toBe('v1.0.1');
      expect(result.type).toBe('patch');
    });
  });

  describe('generateChangelog()', () => {
    it('produces markdown with sections', () => {
      const commits: CommitInfo[] = [
        { hash: 'abc1234', type: 'feat', scope: 'api', subject: 'add endpoint', breaking: false, author: 'dev', date },
        { hash: 'def5678', type: 'fix', subject: 'fix bug', breaking: false, author: 'dev', date },
        { hash: 'ghi9012', type: 'feat', subject: 'breaking thing', breaking: true, author: 'dev', date },
      ];

      const changelog = plugin.generateChangelog(commits, 'v2.0.0');

      expect(changelog).toContain('# Changelog - v2.0.0');
      expect(changelog).toContain('BREAKING CHANGES');
      expect(changelog).toContain('Features');
      expect(changelog).toContain('Bug Fixes');
      expect(changelog).toContain('abc1234'.substring(0, 7));
    });
  });
});
