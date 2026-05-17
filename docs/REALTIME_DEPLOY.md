# Realtime Deploy

EduNity uses a standalone Socket.IO server in `socket-server/server.ts`.

## Why it is separate from Vercel

Vercel Serverless Functions are request/response functions. They are not designed to keep a long-running Socket.IO process alive, hold WebSocket connections, or keep in-memory room state. Deploy the Next.js app to Vercel, and deploy the Socket.IO server separately to a service that supports long-running Node.js processes.

Good options:

- Railway
- Render
- Fly.io
- A VPS running Node.js with a process manager such as PM2

## Required socket server env vars

```bash
NODE_ENV="production"
DATABASE_URL="postgresql://..."
AUTH_SECRET="same-value-as-nextjs"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
SOCKET_ALLOWED_ORIGINS="https://your-domain.vercel.app"
SOCKET_PORT="3001"
REDIS_URL="rediss://..."
```

`AUTH_SECRET` is preferred. `NEXTAUTH_SECRET` is accepted as a fallback, but keep the same secret value between Next.js and the socket server.

`SOCKET_ALLOWED_ORIGINS` is comma-separated:

```bash
SOCKET_ALLOWED_ORIGINS="http://localhost:3000,https://your-domain.vercel.app"
```

## Vercel env var

After the socket server is deployed, set this in the Vercel project:

```bash
NEXT_PUBLIC_SOCKET_URL="https://your-socket-service.example.com"
```

The browser connects to that URL and requests a short-lived socket token from the Next.js app.

## Local test

1. Start Next.js:
   ```bash
   npm run dev
   ```
2. Start Socket.IO:
   ```bash
   npm run socket:dev
   ```
3. Open a lesson with realtime chat in two browser sessions.
4. Send a chat message from session A.
5. Confirm session B receives the message without refreshing.
6. Confirm online count and typing indicators update without refreshing.
