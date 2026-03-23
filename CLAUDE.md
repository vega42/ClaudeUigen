# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
npm run setup        # Install deps + Prisma setup + DB migrations
npm run db:reset     # Reset database (destructive)
```

Tests use Vitest with jsdom. There is no command to run a single test file directly, but you can use `npx vitest run src/path/to/file.test.tsx`.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language; Claude generates/edits them using a virtual file system, and they render live in a sandboxed iframe.

### Key concepts

**Virtual File System** (`src/lib/file-system.ts`, `src/lib/contexts/file-system-context.tsx`): All generated files exist only in memory — no disk writes. The `VirtualFileSystem` class manages an in-memory file tree that is serialized to JSON for DB persistence.

**Live Preview** (`src/components/preview/PreviewFrame.tsx`, `src/lib/transform/jsx-transformer.ts`): The preview panel renders files by compiling JSX with Babel standalone in the browser and generating an ES module import map. Everything runs in a sandboxed iframe.

**AI Integration** (`src/app/api/chat/route.ts`, `src/lib/provider.ts`): The chat API uses Vercel AI SDK's `streamText()` with up to 40 agentic steps. Claude has access to two tools:
- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — view/create/edit files with string replacement
- `file_manager` (`src/lib/tools/file-manager.ts`) — file operations

The provider factory (`src/lib/provider.ts`) checks for `ANTHROPIC_API_KEY`. If missing, it returns a `MockLanguageModel` that generates static multi-step demo responses, so the app works without an API key.

**Auth** (`src/lib/auth.ts`, `src/actions/index.ts`): JWT sessions stored in HTTP-only cookies. Prisma + SQLite backend. Anonymous users get a full editor but no project persistence.

### Data flow

1. User sends chat message → `ChatProvider` (`src/lib/contexts/chat-context.tsx`) POSTs to `/api/chat`
2. Route handler initializes `VirtualFileSystem`, calls Claude with tools
3. Claude streams back tool calls → files created/edited in virtual FS
4. `FileSystemContext` updates → `PreviewFrame` detects entry point, rebuilds iframe HTML
5. If authenticated, project state (messages + file system) saved to DB as JSON

### Project structure

```
src/
├── app/
│   ├── page.tsx               # Home / redirect
│   ├── main-content.tsx       # Main UI shell (resizable panels)
│   ├── [projectId]/page.tsx   # Project editor route
│   └── api/chat/route.ts      # AI streaming endpoint
├── components/
│   ├── chat/                  # Chat UI (MessageList, MessageInput, etc.)
│   ├── editor/                # Monaco editor + FileTree
│   ├── preview/PreviewFrame.tsx
│   └── auth/
├── lib/
│   ├── provider.ts            # Language model factory (Claude or Mock)
│   ├── file-system.ts         # VirtualFileSystem class
│   ├── contexts/              # React contexts for file system + chat state
│   ├── tools/                 # AI tool implementations
│   ├── transform/             # JSX → iframe HTML compilation
│   └── prompts/generation.tsx # Claude system prompt
└── actions/                   # Next.js server actions (auth + projects)
```

### Environment

`ANTHROPIC_API_KEY` is optional — omitting it enables mock mode. The model used is `claude-haiku-4-5` (configured in `src/lib/provider.ts`).

Path alias `@/*` maps to `src/*`.
