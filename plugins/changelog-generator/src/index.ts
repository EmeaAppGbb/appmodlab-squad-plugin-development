export interface CommitInfo {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking: boolean;
  author: string;
  date: Date;
}

export interface ChangelogSection {
  title: string;
  commits: CommitInfo[];
}

export interface VersionBump {
  current: string;
  next: string;
  type: 'major' | 'minor' | 'patch';
}

export class ChangelogGeneratorPlugin {
  private commitTypeMap: Record<string, string> = {
    feat: '🚀 Features',
    fix: '🐛 Bug Fixes',
    docs: '📝 Documentation',
    style: '💅 Styles',
    refactor: '♻️ Code Refactoring',
    perf: '⚡ Performance Improvements',
    test: '✅ Tests',
    build: '🏗️ Build System',
    ci: '👷 CI/CD',
    chore: '🔧 Chores'
  };

  async init() {
    console.log('Changelog Generator Plugin initialized');
    return {
      name: 'changelog-generator',
      version: '1.0.0',
      skills: this.getSkills()
    };
  }

  getSkills() {
    return [
      {
        name: 'generate-changelog',
        description: 'Generate changelog from commit history',
        handler: this.generateChangelog.bind(this)
      },
      {
        name: 'calculate-version',
        description: 'Calculate next version based on commits',
        handler: this.calculateNextVersion.bind(this)
      }
    ];
  }

  parseCommit(commitMessage: string, hash: string, author: string, date: Date): CommitInfo | null {
    const conventionalPattern = /^(\w+)(?:\(([^)]+)\))?!?: (.+)$/;
    const match = commitMessage.match(conventionalPattern);

    if (!match) {
      return null;
    }

    const [, type, scope, subject] = match;
    const breaking = commitMessage.includes('!:') || commitMessage.includes('BREAKING CHANGE');

    return {
      hash,
      type,
      scope,
      subject,
      breaking,
      author,
      date
    };
  }

  categorizeCommits(commits: CommitInfo[]): ChangelogSection[] {
    const sections: Record<string, CommitInfo[]> = {};

    for (const commit of commits) {
      const sectionTitle = this.commitTypeMap[commit.type] || '🔄 Other Changes';
      if (!sections[sectionTitle]) {
        sections[sectionTitle] = [];
      }
      sections[sectionTitle].push(commit);
    }

    return Object.entries(sections).map(([title, commits]) => ({
      title,
      commits
    }));
  }

  generateChangelog(commits: CommitInfo[], version: string): string {
    const breaking = commits.filter(c => c.breaking);
    const sections = this.categorizeCommits(commits);

    let changelog = `# Changelog - ${version}\n\n`;
    changelog += `**Release Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

    if (breaking.length > 0) {
      changelog += `## ⚠️ BREAKING CHANGES\n\n`;
      breaking.forEach(commit => {
        changelog += `- **${commit.scope ? `${commit.scope}: ` : ''}${commit.subject}** (${commit.hash.substring(0, 7)})\n`;
      });
      changelog += '\n';
    }

    sections.forEach(section => {
      changelog += `## ${section.title}\n\n`;
      section.commits.forEach(commit => {
        const scopeStr = commit.scope ? `**${commit.scope}:** ` : '';
        changelog += `- ${scopeStr}${commit.subject} (${commit.hash.substring(0, 7)})\n`;
      });
      changelog += '\n';
    });

    return changelog;
  }

  calculateNextVersion(currentVersion: string, commits: CommitInfo[]): VersionBump {
    const [major, minor, patch] = currentVersion.replace('v', '').split('.').map(Number);

    const hasBreaking = commits.some(c => c.breaking);
    const hasFeatures = commits.some(c => c.type === 'feat');
    const hasFixes = commits.some(c => c.type === 'fix');

    let nextMajor = major;
    let nextMinor = minor;
    let nextPatch = patch;
    let type: 'major' | 'minor' | 'patch';

    if (hasBreaking) {
      nextMajor += 1;
      nextMinor = 0;
      nextPatch = 0;
      type = 'major';
    } else if (hasFeatures) {
      nextMinor += 1;
      nextPatch = 0;
      type = 'minor';
    } else if (hasFixes) {
      nextPatch += 1;
      type = 'patch';
    } else {
      nextPatch += 1;
      type = 'patch';
    }

    return {
      current: currentVersion,
      next: `v${nextMajor}.${nextMinor}.${nextPatch}`,
      type
    };
  }
}

export default ChangelogGeneratorPlugin;
