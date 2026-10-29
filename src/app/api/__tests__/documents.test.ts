import { POST } from '../documents/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  authOptions: {},
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/document-parser');
jest.mock('@/lib/chunker');
jest.mock('@/lib/embeddings');

describe('Documents API', () => {
  describe('POST /api/documents', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should reject unauthorized requests', async () => {
      const { getServerSession } = require('@/lib/auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
      });

      const response = await POST(request);
      
      expect(response.status).toBe(401);
    });

    it('should reject requests without OPENAI_API_KEY', async () => {
      const { getServerSession } = require('@/lib/auth');
      getServerSession.mockResolvedValue({ user: { id: 'user1' } });
      delete process.env.OPENAI_API_KEY;

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
    });

    it('should reject duplicate file names', async () => {
      const { getServerSession } = require('@/lib/auth');
      const { prisma } = require('@/lib/prisma');
      
      getServerSession.mockResolvedValue({ user: { id: 'user1' } });
      prisma.document.findFirst.mockResolvedValue({ id: 'existing' });

      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.pdf');

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      
      expect(response.status).toBe(409);
    });
  });
});
