import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JiraIntegrationPlugin, JiraPluginConfig } from './index';

vi.mock('axios', () => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  return {
    default: {
      create: vi.fn(() => ({
        post: mockPost,
        get: mockGet,
      })),
    },
  };
});

import axios from 'axios';

const config: JiraPluginConfig = {
  jiraUrl: 'https://test.atlassian.net',
  username: 'user@test.com',
  apiToken: 'test-token',
  projectKey: 'PROJ',
};

describe('JiraIntegrationPlugin', () => {
  let plugin: JiraIntegrationPlugin;
  let mockClient: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    plugin = new JiraIntegrationPlugin(config);
    // Grab the mock client returned by axios.create
    mockClient = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
  });

  describe('init()', () => {
    it('returns correct metadata', async () => {
      const result = await plugin.init();
      expect(result.name).toBe('jira-integration');
      expect(result.version).toBe('1.0.0');
      expect(result.skills).toHaveLength(2);
    });
  });

  describe('getSkills()', () => {
    it('returns 2 skills with correct names', () => {
      const skills = plugin.getSkills();
      expect(skills).toHaveLength(2);
      expect(skills[0].name).toBe('sync-issue-to-jira');
      expect(skills[1].name).toBe('sync-status-from-jira');
    });
  });

  describe('syncIssueToJira()', () => {
    it('creates a Jira issue and returns it', async () => {
      mockClient.post.mockResolvedValue({ data: { key: 'PROJ-1' } });

      const githubIssue = { title: 'Test Issue', body: 'Issue body' };
      const result = await plugin.syncIssueToJira(githubIssue);

      expect(mockClient.post).toHaveBeenCalledWith('/issue', expect.objectContaining({
        fields: expect.objectContaining({
          project: { key: 'PROJ' },
          summary: 'Test Issue',
          issuetype: { name: 'Task' },
        }),
      }));
      expect(result.key).toBe('PROJ-1');
      expect(result.summary).toBe('Test Issue');
      expect(result.description).toBe('Issue body');
      expect(result.status).toBe('To Do');
    });
  });

  describe('syncStatusFromJira()', () => {
    it('maps Jira "Done" status to "closed"', async () => {
      mockClient.get.mockResolvedValue({
        data: { fields: { status: { name: 'Done' } } },
      });

      const status = await plugin.syncStatusFromJira('PROJ-1');

      expect(mockClient.get).toHaveBeenCalledWith('/issue/PROJ-1');
      expect(status).toBe('closed');
    });

    it('maps unknown status to "open"', async () => {
      mockClient.get.mockResolvedValue({
        data: { fields: { status: { name: 'Unknown' } } },
      });

      const status = await plugin.syncStatusFromJira('PROJ-2');
      expect(status).toBe('open');
    });
  });
});
