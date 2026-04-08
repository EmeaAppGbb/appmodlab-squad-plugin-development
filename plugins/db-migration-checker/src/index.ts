import * as fs from 'fs';
import * as path from 'path';

export interface SafetyRule {
  pattern: RegExp;
  severity: 'error' | 'warning';
  message: string;
}

export interface SafetyReport {
  safe: boolean;
  issues: SafetyIssue[];
}

export interface SafetyIssue {
  file: string;
  line: number;
  severity: 'error' | 'warning';
  rule: string;
  message: string;
  snippet: string;
}

export class DbMigrationCheckerPlugin {
  private safetyRules: SafetyRule[] = [
    {
      pattern: /DROP\s+TABLE/i,
      severity: 'error',
      message: 'DROP TABLE detected - potential data loss'
    },
    {
      pattern: /DROP\s+COLUMN/i,
      severity: 'error',
      message: 'DROP COLUMN detected - potential data loss'
    },
    {
      pattern: /ALTER\s+TABLE\s+\w+\s+DROP/i,
      severity: 'error',
      message: 'ALTER TABLE DROP detected - potential data loss'
    },
    {
      pattern: /TRUNCATE\s+TABLE/i,
      severity: 'error',
      message: 'TRUNCATE TABLE detected - data will be deleted'
    },
    {
      pattern: /DELETE\s+FROM.*WHERE/i,
      severity: 'warning',
      message: 'DELETE with WHERE clause - review carefully'
    },
    {
      pattern: /ALTER\s+TABLE\s+\w+\s+RENAME/i,
      severity: 'warning',
      message: 'RENAME operation - may break existing code'
    },
    {
      pattern: /CREATE\s+UNIQUE\s+INDEX/i,
      severity: 'warning',
      message: 'UNIQUE constraint added - may fail on existing data'
    }
  ];

  async init() {
    console.log('DB Migration Checker Plugin initialized');
    return {
      name: 'db-migration-checker',
      version: '1.0.0',
      skills: this.getSkills()
    };
  }

  getSkills() {
    return [
      {
        name: 'check-migration-safety',
        description: 'Check database migrations for destructive changes',
        handler: this.checkMigrationSafety.bind(this)
      }
    ];
  }

  async checkMigrationSafety(migrationDir: string): Promise<SafetyReport> {
    const issues: SafetyIssue[] = [];
    const files = this.findMigrationFiles(migrationDir);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const rule of this.safetyRules) {
          if (rule.pattern.test(line)) {
            issues.push({
              file: path.basename(file),
              line: index + 1,
              severity: rule.severity,
              rule: rule.pattern.source,
              message: rule.message,
              snippet: line.trim()
            });
          }
        }
      });
    }

    const hasErrors = issues.some(issue => issue.severity === 'error');

    return {
      safe: !hasErrors,
      issues
    };
  }

  private findMigrationFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.findMigrationFiles(fullPath));
      } else if (entry.name.endsWith('.sql') || entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  generateReport(report: SafetyReport): string {
    if (report.safe && report.issues.length === 0) {
      return '✅ All migrations are safe - no destructive changes detected.';
    }

    let output = '## Migration Safety Report\n\n';
    
    const errors = report.issues.filter(i => i.severity === 'error');
    const warnings = report.issues.filter(i => i.severity === 'warning');

    if (errors.length > 0) {
      output += `### ❌ Errors (${errors.length})\n\n`;
      errors.forEach(issue => {
        output += `**${issue.file}:${issue.line}**\n`;
        output += `- ${issue.message}\n`;
        output += `- \`${issue.snippet}\`\n\n`;
      });
    }

    if (warnings.length > 0) {
      output += `### ⚠️ Warnings (${warnings.length})\n\n`;
      warnings.forEach(issue => {
        output += `**${issue.file}:${issue.line}**\n`;
        output += `- ${issue.message}\n`;
        output += `- \`${issue.snippet}\`\n\n`;
      });
    }

    return output;
  }
}

export default DbMigrationCheckerPlugin;
