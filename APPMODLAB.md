---
title: "SQUAD Plugin Development"
description: "Build and publish custom SQUAD plugins to extend agent capabilities with new skills and integrations"
authors: ["marconsilva"]
category: "Agentic Software Development"
industry: "Cross-Industry"
services: []
languages: ["TypeScript", "JavaScript"]
frameworks: ["Node.js"]
modernizationTools: []
agenticTools: ["SQUAD"]
tags: ["squad", "plugins", "agentic", "typescript", "sdk"]
extensions: ["github.copilot"]
thumbnail: ""
video: ""
version: "1.0.0"
---

# SQUAD Plugin Development

## Overview

This lab teaches you how to build and publish plugins that extend SQUAD capabilities. Plugins can add new skills to agents, integrate with external tools, define custom ceremonies, or provide domain-specific review rules. You'll learn the SQUAD plugin API, packaging standards, and distribution through the plugin registry.

## Learning Objectives

By completing this lab, you will:
- Understand the SQUAD plugin architecture and SDK
- Build a plugin that adds skills to SQUAD agents
- Build a plugin that integrates SQUAD with external tools (Jira)
- Build a plugin that defines custom review rules
- Package and publish SQUAD plugins to npm

## Prerequisites

- Strong TypeScript development experience
- Familiarity with SQUAD concepts (agents, skills, ceremonies)
- npm publishing experience (or npm account for publishing)
- Basic Jira API knowledge (for plugin 1)

## Architecture

This lab builds three functional SQUAD plugins:

1. **Jira Integration** - Bidirectional issue synchronization
2. **DB Migration Checker** - Detects destructive database changes
3. **Changelog Generator** - Generates release notes from conventional commits

Each plugin exports a standard interface and integrates with SQUAD agents.

> 📸 [View: Plugin Architecture Overview](assets/screenshots/01-plugin-architecture.html)
> *Open the HTML file in a browser to view the syntax-highlighted rendering.*

## Lab Instructions

### Step 1: Set Up Plugin SDK

**Objective:** Install SQUAD SDK and create plugin scaffold.

1. Review the three plugin directories:
   - `plugins/jira-integration`
   - `plugins/db-migration-checker`
   - `plugins/changelog-generator`

2. Each plugin has:
   - `package.json` with `@squad/sdk` peer dependency
   - TypeScript configuration
   - Test setup

3. Review the Plugin SDK reference at `docs/plugin-sdk-reference.md`

> 📸 [View: Plugin SDK Reference — Interfaces](assets/screenshots/06-plugin-sdk-reference.html)
> *Open the HTML file in a browser to view the syntax-highlighted rendering.*

### Step 2: Build Jira Plugin

**Objective:** Implement issue sync and bidirectional status updates.

1. Review the Jira plugin implementation at `plugins/jira-integration/src/index.ts`

2. Key features:
   - **init()** - Initializes plugin and returns metadata
   - **getSkills()** - Defines two skills:
     - `sync-issue-to-jira` - Creates Jira issue from GitHub issue
     - `sync-status-from-jira` - Updates GitHub status from Jira

3. Configuration:
   ```typescript
   {
     jiraUrl: 'https://your-org.atlassian.net',
     username: 'user@example.com',
     apiToken: 'your-api-token',
     projectKey: 'PROJ'
   }
   ```

4. Usage in SQUAD:
   ```yaml
   # .squad/team.yml
   plugins:
     - name: jira-integration
       config:
         jiraUrl: https://company.atlassian.net
         projectKey: DEV
   ```

> 📸 [View: Jira Integration Plugin Source](assets/screenshots/02-jira-plugin-source.html)
> *Open the HTML file in a browser to view the syntax-highlighted rendering.*

### Step 3: Build DB Migration Checker

**Objective:** Parse migration files and detect destructive changes.

1. Review the DB migration checker at `plugins/db-migration-checker/src/index.ts`

2. Safety rules detect:
   - ❌ `DROP TABLE` - Error
   - ❌ `DROP COLUMN` - Error
   - ❌ `TRUNCATE TABLE` - Error
   - ⚠️ `RENAME` operations - Warning
   - ⚠️ `UNIQUE` constraints - Warning

3. The checker:
   - Scans migration directory recursively
   - Applies regex patterns to detect issues
   - Generates a safety report

4. Eyes agent uses this skill:
   ```yaml
   # Eyes reviews PR with migrations
   - skill: check-migration-safety
     input: prisma/migrations
   ```

5. Test with sample migrations in `test-project/prisma/migrations/`

> 📸 [View: DB Migration Checker — Safety Rules & Patterns](assets/screenshots/03-db-migration-checker-source.html)
> *Open the HTML file in a browser to view the syntax-highlighted rendering.*

> 📸 [View: Test Migrations — Safe vs. Destructive SQL](assets/screenshots/05-test-project-migrations.html)
> *Open the HTML file in a browser to view the syntax-highlighted rendering.*

### Step 4: Build Changelog Generator

**Objective:** Parse commits and generate changelog with version calculation.

1. Review the changelog generator at `plugins/changelog-generator/src/index.ts`

2. Features:
   - Parses conventional commits (feat:, fix:, docs:, etc.)
   - Categorizes commits by type
   - Detects breaking changes
   - Calculates semantic version bump

3. Version calculation:
   - Breaking change → Major version (1.0.0 → 2.0.0)
   - New feature → Minor version (1.0.0 → 1.1.0)
   - Bug fix → Patch version (1.0.0 → 1.0.1)

4. Mouth agent uses this skill:
   ```yaml
   # Mouth generates release notes
   - skill: generate-changelog
     commits: [...]
     version: v1.2.0
   ```

> 📸 [View: Changelog Generator — Commit-Type Map & Semver Logic](assets/screenshots/04-changelog-generator-source.html)
> *Open the HTML file in a browser to view the syntax-highlighted rendering.*

### Step 5: Write Tests

**Objective:** Unit tests for each plugin with mocked SQUAD context.

1. Test structure for each plugin:
   ```typescript
   describe('PluginName', () => {
     it('should initialize', async () => {
       const plugin = new Plugin(config);
       const metadata = await plugin.init();
       expect(metadata.name).toBe('plugin-name');
     });
     
     it('should execute skill', async () => {
       const plugin = new Plugin(config);
       const result = await plugin.skillHandler(input);
       expect(result).toBeDefined();
     });
   });
   ```

2. Run tests:
   ```bash
   cd plugins/jira-integration
   npm test
   ```

### Step 6: Package Plugins

**Objective:** Configure npm packaging, peer dependencies, entry points.

1. Each plugin's `package.json` includes:
   - **name**: `@squad/plugin-{name}`
   - **main**: `dist/index.js`
   - **types**: `dist/index.d.ts`
   - **peerDependencies**: `@squad/sdk`

2. Build plugins:
   ```bash
   cd plugins/jira-integration
   npm run build
   ```

3. Verify output in `dist/` folder

> 📸 [View: npm Package Configurations](assets/screenshots/07-package-config.html)
> *Open the HTML file in a browser to view the syntax-highlighted rendering.*

### Step 7: Test in Sample Project

**Objective:** Configure SQUAD to use plugins and run development cycle.

1. The test project (`test-project/`) demonstrates plugin usage:
   - Database migrations for testing DB checker
   - Sample commits for changelog generator

2. Install plugins locally:
   ```bash
   cd test-project
   npm install
   ```

3. Plugins are linked via `file:../plugins/{name}` in package.json

4. Test each plugin:
   ```bash
   # DB Migration Checker
   node -e "
     const DbChecker = require('@squad/plugin-db-migration-checker');
     const checker = new DbChecker.default();
     checker.checkMigrationSafety('./prisma/migrations').then(console.log);
   "
   ```

### Step 8: Publish to npm

**Objective:** Publish plugins to npm registry.

1. Login to npm:
   ```bash
   npm login
   ```

2. Publish each plugin:
   ```bash
   cd plugins/jira-integration
   npm publish --access public
   ```

3. Verify published:
   ```bash
   npm view @squad/plugin-jira-integration
   ```

Note: For this lab, publishing is optional. You can test with local links.

## Key Concepts

### Plugin Lifecycle

```
Load → Init → Register Skills → Execute → Cleanup
```

### Skill Definition

```typescript
{
  name: 'skill-name',
  description: 'What this skill does',
  handler: async (context, input) => {
    // Skill logic
    return result;
  }
}
```

### Agent Integration

| Agent | Common Plugin Skills |
|-------|---------------------|
| Eyes | Code review rules, security checks |
| Mouth | Release notes, documentation |
| Brain | Architecture analysis, planning |
| Hands | Code generation, refactoring |
| Ralph | Task automation, scheduling |

## Success Criteria

✅ SQUAD Plugin SDK is documented with API reference  
✅ Jira plugin syncs issues bidirectionally  
✅ DB migration checker detects destructive changes  
✅ Changelog generator produces correct Markdown  
✅ All three plugins pass unit and integration tests  
✅ Plugins install and configure via SQUAD team.yml  
✅ Sample project demonstrates all three plugins  

## Screenshots

The `assets/screenshots/` directory contains syntax-highlighted HTML renderings of the lab's key files. Open any `.html` file in a browser to view or capture a screenshot.

| # | File | What it shows |
|---|------|---------------|
| 1 | [`01-plugin-architecture.html`](assets/screenshots/01-plugin-architecture.html) | High-level overview: three plugins, lifecycle flow, agent mapping |
| 2 | [`02-jira-plugin-source.html`](assets/screenshots/02-jira-plugin-source.html) | Jira Integration plugin source with config interface and skill handlers |
| 3 | [`03-db-migration-checker-source.html`](assets/screenshots/03-db-migration-checker-source.html) | DB Migration Checker safety rules table and regex patterns |
| 4 | [`04-changelog-generator-source.html`](assets/screenshots/04-changelog-generator-source.html) | Changelog Generator commit-type map and semver bump logic |
| 5 | [`05-test-project-migrations.html`](assets/screenshots/05-test-project-migrations.html) | Test migrations: safe vs. destructive SQL side-by-side |
| 6 | [`06-plugin-sdk-reference.html`](assets/screenshots/06-plugin-sdk-reference.html) | SDK interfaces (SquadPlugin, AgentContext, EventHooks) |
| 7 | [`07-package-config.html`](assets/screenshots/07-package-config.html) | npm package.json configs and local file: linking |

## Resources

- [SQUAD Plugin API](https://squad.dev/docs/plugins)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Troubleshooting

**Issue:** Plugin not loading in SQUAD  
**Solution:** Verify peer dependency version matches SQUAD SDK

**Issue:** TypeScript compilation errors  
**Solution:** Ensure `@squad/sdk` types are available

**Issue:** Plugin skill not registered  
**Solution:** Check that `getSkills()` returns array of skill objects

---

## Solution Walkthrough

The complete solution is on the `solution-final` branch with step-by-step tags.

### Branch & Setup
```powershell
git checkout main && git checkout -b solution-final
New-Item -ItemType Directory -Force -Path assets/outputs
```

### Step 1: Set Up Plugin SDK (`step-01-plugin-sdk`)
```powershell
gh copilot -- -p "Review the SQUAD plugin SDK setup in this repo. Examine the three plugin directories and the SDK reference at docs/plugin-sdk-reference.md. Summarize the plugin architecture and interfaces." --allow-all-tools --yolo
```
**Output:** Identified 3 plugins (jira-integration, db-migration-checker, changelog-generator) implementing SquadPlugin interface with init()/getSkills(). SDK defines PluginMetadata, Skill, AgentContext, EventHooks, and PluginConfig interfaces.

### Step 2: Build Jira Plugin (`step-02-jira-plugin`)
```powershell
gh copilot -- -p "Implement the Jira integration plugin at plugins/jira-integration/src/index.ts. It should export init(), getSkills() with two skills: sync-issue-to-jira and sync-status-from-jira. Follow the SquadPlugin interface from the SDK reference." --allow-all-tools --yolo
```
**Output:** JiraIntegrationPlugin with axios-based REST client. Skills: sync-issue-to-jira (creates Jira issues from GitHub issues) and sync-status-from-jira (maps Jira statuses: Done→closed, In Progress→in-progress, etc.).

### Step 3: Build DB Migration Checker (`step-03-db-migration-checker`)
```powershell
gh copilot -- -p "Implement the DB migration checker plugin at plugins/db-migration-checker/src/index.ts. It should detect destructive SQL operations (DROP TABLE, DROP COLUMN, TRUNCATE) as errors and RENAME/UNIQUE as warnings. Scan migration files recursively and generate safety reports." --allow-all-tools --yolo
```
**Output:** DbMigrationCheckerPlugin with 7 safety rules (4 errors, 3 warnings). Recursively scans .sql/.ts files, applies regex patterns, generates SafetyReport with file/line/severity/snippet details.

### Step 4: Build Changelog Generator (`step-04-changelog-generator`)
```powershell
gh copilot -- -p "Implement the changelog generator plugin at plugins/changelog-generator/src/index.ts. It should parse conventional commits (feat:, fix:, docs:, etc.), categorize them, detect breaking changes, and calculate semantic version bumps. Generate formatted CHANGELOG.md output." --allow-all-tools --yolo
```
**Output:** ChangelogGeneratorPlugin with 10 commit types mapped to emoji sections. Parses conventional commits via regex, detects breaking changes (!: or BREAKING CHANGE), calculates semver bumps (breaking→major, feat→minor, fix→patch).

### Step 5: Test Plugins (`step-05-test-plugins`)
```powershell
cd plugins/jira-integration && npx vitest run && cd ../..
cd plugins/db-migration-checker && npx vitest run && cd ../..
cd plugins/changelog-generator && npx vitest run && cd ../..
```
**Output:** 22 tests passing across all 3 plugins:
- jira-integration: 5 tests (init, getSkills, syncIssueToJira, syncStatusFromJira x2)
- db-migration-checker: 6 tests (init, getSkills, checkMigrationSafety x2, generateReport x2)
- changelog-generator: 11 tests (init, getSkills, parseCommit x4, categorize, calculateVersion x3, generateChangelog)

### Step 6: Register Plugins with Squad (`step-06-register-plugins`)
```powershell
gh copilot -- -p "Register all three plugins with the Squad team configuration. Update .squad/ config to reference the plugins with their configurations. Show how each plugin integrates with specific Squad agents (Jira→Lead, DB Migration→Eyes, Changelog→Mouth)." --allow-all-tools --yolo
```
**Output:** Created `.squad/team.yml` and `.squad/plugins.json`. Agent mapping: Lead→jira-integration, Eyes→db-migration-checker, Mouth→changelog-generator.

### Step 7: Package & Document (`step-07-package-document`)
```powershell
gh copilot -- -p "Generate packaging instructions and npm publish documentation for all three Squad plugins." --allow-all-tools --yolo
```
**Output:** Build with `npx tsc`, publish with `npm publish --access public`. Package names: @squad/plugin-{name}. Local dev via `file:../plugins/{name}` references.

### Push Solution
```powershell
git push origin solution-final --tags
```

All step outputs are saved in `assets/outputs/step-NN-*.txt`.

---

**Estimated Duration:** 4-6 hours  
**Difficulty:** Advanced  
**Category:** Agentic Software Development
