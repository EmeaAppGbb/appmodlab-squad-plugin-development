import axios from 'axios';

export interface JiraPluginConfig {
  jiraUrl: string;
  username: string;
  apiToken: string;
  projectKey: string;
}

export interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee?: string;
}

export class JiraIntegrationPlugin {
  private config: JiraPluginConfig;
  private client: any;

  constructor(config: JiraPluginConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.jiraUrl}/rest/api/3`,
      auth: {
        username: config.username,
        password: config.apiToken
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async init() {
    console.log('Jira Integration Plugin initialized');
    return {
      name: 'jira-integration',
      version: '1.0.0',
      skills: this.getSkills()
    };
  }

  getSkills() {
    return [
      {
        name: 'sync-issue-to-jira',
        description: 'Sync GitHub issue to Jira',
        handler: this.syncIssueToJira.bind(this)
      },
      {
        name: 'sync-status-from-jira',
        description: 'Update GitHub issue status from Jira',
        handler: this.syncStatusFromJira.bind(this)
      }
    ];
  }

  async syncIssueToJira(githubIssue: any): Promise<JiraIssue> {
    const jiraIssue = {
      fields: {
        project: { key: this.config.projectKey },
        summary: githubIssue.title,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: githubIssue.body || 'No description' }
              ]
            }
          ]
        },
        issuetype: { name: 'Task' }
      }
    };

    const response = await this.client.post('/issue', jiraIssue);
    
    return {
      key: response.data.key,
      summary: githubIssue.title,
      description: githubIssue.body,
      status: 'To Do'
    };
  }

  async syncStatusFromJira(jiraKey: string): Promise<string> {
    const response = await this.client.get(`/issue/${jiraKey}`);
    const status = response.data.fields.status.name;
    
    const statusMapping: Record<string, string> = {
      'To Do': 'open',
      'In Progress': 'in-progress',
      'Done': 'closed',
      'Blocked': 'blocked'
    };
    
    return statusMapping[status] || 'open';
  }

  async getIssue(jiraKey: string): Promise<JiraIssue> {
    const response = await this.client.get(`/issue/${jiraKey}`);
    return {
      key: response.data.key,
      summary: response.data.fields.summary,
      description: response.data.fields.description,
      status: response.data.fields.status.name,
      assignee: response.data.fields.assignee?.displayName
    };
  }
}

export default JiraIntegrationPlugin;
