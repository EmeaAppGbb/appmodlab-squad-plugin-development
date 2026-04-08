# SQUAD Plugin SDK Reference

## Plugin Interface

Every SQUAD plugin must implement the following interface:

```typescript
interface SquadPlugin {
  init(): Promise<PluginMetadata>;
  getSkills(): Skill[];
}

interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
}

interface Skill {
  name: string;
  description: string;
  handler: Function;
}
```

## Plugin Lifecycle

1. **Initialization** - Plugin is loaded and `init()` is called
2. **Skill Registration** - Skills are registered with SQUAD agents
3. **Event Hooks** - Plugin responds to lifecycle events
4. **Skill Execution** - Agent invokes skill handlers
5. **Cleanup** - Plugin cleanup on shutdown

## Configuration Schema

Plugins can define configuration schemas:

```typescript
interface PluginConfig {
  schema: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'object';
      required: boolean;
      default?: any;
      description?: string;
    }
  };
}
```

## Event Hooks

Plugins can subscribe to SQUAD lifecycle events:

```typescript
interface EventHooks {
  onPRCreated?: (pr: PullRequest) => void;
  onIssueOpened?: (issue: Issue) => void;
  onCommitPushed?: (commit: Commit) => void;
  onDeploymentStarted?: (deployment: Deployment) => void;
}
```

## Agent Context

Skill handlers receive agent context:

```typescript
interface AgentContext {
  agent: string;  // 'eyes', 'mouth', 'brain', 'hands', 'ralph'
  repository: string;
  workspace: string;
  config: Record<string, any>;
}
```

## Example Plugin Structure

```typescript
export class MyPlugin {
  private config: MyPluginConfig;
  
  constructor(config: MyPluginConfig) {
    this.config = config;
  }
  
  async init() {
    return {
      name: 'my-plugin',
      version: '1.0.0',
      skills: this.getSkills()
    };
  }
  
  getSkills() {
    return [
      {
        name: 'my-skill',
        description: 'Does something useful',
        handler: this.mySkillHandler.bind(this)
      }
    ];
  }
  
  async mySkillHandler(context: AgentContext, input: any) {
    // Skill implementation
    return result;
  }
}
```

## Publishing

Plugins are published as npm packages:

```bash
npm publish --access public
```

Package name format: `@squad/plugin-{name}`

## Testing

Test plugins using SQUAD SDK test utilities:

```typescript
import { createTestContext } from '@squad/sdk/testing';

describe('MyPlugin', () => {
  it('should execute skill', async () => {
    const plugin = new MyPlugin(config);
    const context = createTestContext('eyes');
    const result = await plugin.mySkillHandler(context, input);
    expect(result).toBeDefined();
  });
});
```
