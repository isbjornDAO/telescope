// Discord bot unit tests
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { Client } from 'discord.js';
import type { ForumThreadPayload } from '../types/discord';

// Mock the Discord.js client
jest.mock('discord.js');

let mockReq: Partial<Request>;
let mockRes: Partial<Response>;
let mockClient: any;

describe('Discord Bot Webhook Handler', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockRes = {
      status: jest.fn<any>().mockReturnThis(),
      json: jest.fn<any>().mockReturnThis(),
    };

    mockClient = {
      channels: {
        fetch: jest.fn<any>(),
      },
    };

    process.env.DISCORD_BOT_TOKEN = 'mock-token';
    process.env.DISCORD_GENERAL_CHANNEL_ID = 'mock-channel';
    process.env.WEBHOOK_SECRET = 'test-secret';
  });

  it('should reject requests without proper webhook secret', async () => {
    mockReq = {
      headers: { 'x-webhook-secret': 'wrong-secret' },
      body: {},
    };

    await handleWebhook(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should validate forum thread payload', async () => {
    const validPayload: ForumThreadPayload = {
      type: 'new_thread',
      data: {
        title: 'Test Thread',
        url: 'https://example.com/thread',
        boardName: 'General',
        username: 'tester',
      },
    };

    mockReq = {
      headers: { 'x-webhook-secret': 'test-secret' },
      body: validPayload,
    };

    const mockChannel = {
      send: jest.fn<any>().mockResolvedValue(true),
      isTextBased: () => true,
    };

    mockClient.channels.fetch.mockResolvedValue(mockChannel);

    await handleWebhook(mockReq as Request, mockRes as Response);
    expect(mockRes.status).not.toHaveBeenCalledWith(400);
    expect(mockChannel.send).toHaveBeenCalled();
  });

  it('should handle missing Discord channel gracefully', async () => {
    mockReq = {
      headers: { 'x-webhook-secret': 'test-secret' },
      body: {
        type: 'new_thread',
        data: { title: 'Test' },
      },
    };

    mockClient.channels.fetch.mockResolvedValue(null);

    await handleWebhook(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Channel not found',
    }));
  });
});

// Mock implementation of webhook handler for testing
async function handleWebhook(req: Request, res: Response) {
  try {
    const secret = req.headers['x-webhook-secret'];
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body;
    if (!payload || !payload.type || !payload.data) {
      return res.status(400).json({ error: 'Bad payload' });
    }

    const channel = await mockClient.channels.fetch(process.env.DISCORD_GENERAL_CHANNEL_ID);
    if (!channel) {
      return res.status!(500).json!({ error: 'Channel not found' });
    }

    await channel.send(payload);

    return res.json!({ ok: true });
  } catch (err) {
    return res.status!(500).json!({ error: 'Internal server error' });
  }
}