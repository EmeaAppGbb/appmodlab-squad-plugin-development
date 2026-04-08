---
title: "SQUAD Plugin Development"
category: "Agentic Software Development"
priority: "P3"
languages: ["TypeScript"]
duration: "4-6 hours"
repository: "appmodlab-squad-plugin-development"
organization: "EmeaAppGbb"
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

**Estimated Duration:** 4-6 hours  
**Difficulty:** Advanced  
**Category:** Agentic Software Development
