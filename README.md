# Personal Knowledge Assistent

A production-minded web application for building a private knowledge library. Upload your documents (PDF, Markdown, plain text), and ask questions about them with AI-powered answers grounded in your sources with verifiable citations.

## Features

- **Document Management**: Upload PDF, Markdown, and plain text files (max 10MB)
- **AI-Powered Search**: Semantic retrieval using OpenAI embeddings
- **Grounded Answers**: Chat interface with citations linking answers to source documents
- **User Isolation**: Each user's documents and conversations are completely isolated
- **Processing Status**: Real-time tracking of document indexing progress
- **Conversation History**: Save and revisit previous conversations
- **Privacy-First**: Documents and prompts are never logged

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (for easy local development)
- **Authentication**: NextAuth.js with credentials provider
- **AI/ML**: OpenAI API for embeddings (text-embedding-3-small) and chat (gpt-4o-mini)
- **Document Processing**: pdf-parse for PDFs, custom parsers for Markdown/text

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "personal knowledge Assistent"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   NEXTAUTH_SECRET=generate-a-random-secret
   DATABASE_URL=file:./dev.db
   ```

   Generate a NEXTAUTH_SECRET with:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Sign up**: Create an account with your email and password
2. **Upload documents**: Go to the Library tab and upload PDF, Markdown, or text files
3. **Wait for processing**: Documents are automatically parsed, chunked, and indexed
4. **Ask questions**: Go to the Conversations tab, create a new chat, and ask questions about your documents
5. **View citations**: Each answer includes citations showing which documents and pages support the response

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── documents/         # Document CRUD operations
│   │   ├── conversations/     # Conversation management
│   │   └── chat/              # Chat and RAG endpoint
│   ├── auth/                  # Sign in/sign up pages
│   ├── dashboard/             # Main application UI
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── auth.ts                # NextAuth configuration
│   ├── chunker.ts             # Text chunking logic
│   ├── document-parser.ts     # PDF/Markdown/text parsing
│   ├── embeddings.ts          # OpenAI embeddings
│   ├── prisma.ts              # Prisma client
│   ├── rag.ts                 # RAG answer generation
│   ├── retrieval.ts           # Semantic search
│   ├── utils.ts               # Utility functions
│   └── validations.ts         # Zod schemas
└── types/
    └── next-auth.d.ts         # NextAuth type extensions
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/[...nextauth]` - NextAuth authentication handler

### Documents
- `GET /api/documents` - List user's documents
- `POST /api/documents` - Upload a new document
- `DELETE /api/documents/[id]` - Delete a document

### Conversations
- `GET /api/conversations` - List user's conversations
- `POST /api/conversations` - Create a new conversation
- `DELETE /api/conversations/[id]` - Delete a conversation
- `GET /api/conversations/[id]/messages` - Get conversation messages

### Chat
- `POST /api/chat` - Send a message and get AI response with citations

## Development

### Run type checking
```bash
npm run type-check
```

### Run linting
```bash
npm run lint
```

### Run tests
```bash
npm test
```

### View database
```bash
npm run prisma:studio
```

## Configuration

### Chunking Settings
Modify chunk size and overlap in `src/lib/chunker.ts`:
```typescript
const chunks = chunkText(text, pages, maxChunkSize = 1000, overlap = 200);
```

### Retrieval Settings
Modify number of retrieved chunks in `src/lib/retrieval.ts`:
```typescript
const retrievedChunks = await retrieveRelevantChunks(query, userId, topK = 5);
```

### Model Selection
Change models in `src/lib/embeddings.ts` and `src/lib/rag.ts`:
- Embeddings: `openai.embedding('text-embedding-3-small')`
- Chat: `openai('gpt-4o-mini')`

## Security Considerations

- **User Isolation**: All database queries filter by `userId` to prevent cross-user data access
- **Authorization**: API routes verify session ownership before allowing operations
- **File Validation**: File types and sizes are validated on both client and server
- **No Secret Logging**: Document contents and prompts are never logged
- **Environment Variables**: API keys are never exposed to the browser

## Known Limitations

1. **File Storage**: Documents are processed in memory without persistent file storage. The reprocess feature requires file storage to work fully.
2. **Database**: SQLite is used for simplicity. For production, consider PostgreSQL or MySQL.
3. **Embedding Storage**: Embeddings are stored as JSON strings in SQLite. For large-scale use, consider a vector database like Pinecone or pgvector.
4. **Streaming**: Chat responses are not streamed. For a better UX, implement streaming responses.
5. **Rate Limiting**: No rate limiting is implemented. Add rate limiting for production use.

## Testing

Tests are included for:
- Authentication and user data isolation
- Document processing and chunking
- Retrieval and citation correctness
- API endpoint behavior

Run tests with:
```bash
npm test
```

## Deployment

### Environment Variables
Ensure the following are set in your deployment environment:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `OPENAI_API_KEY`

### Database Migrations
Run migrations on your production database:
```bash
npx prisma migrate deploy
```

### Build
```bash
npm run build
npm start
```

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
