# Taskly

A distributed, event-driven task and queue management engine for running heavy background jobs asynchronously.

Taskly allows applications to create, schedule, and track resource-intensive tasks without blocking the main application flow. Heavy work is delegated to background workers while real-time status updates are delivered to connected clients.

## Local Development

Clone the repository and install all project dependencies:

```bash
git clone <repository-url>
cd Taskly
npm install
```

Compile the TypeScript source into JavaScript:

```bash
npm run build
```

Start the compiled application:

```bash
npm start
```

During development, use the development script:

```bash
npm run dev
```

Store local configuration and credentials in .env. Use .env.example as the reference for required variables. Never commit .env, secrets, credentials, or tokens to the repository. Generated files and dependencies are excluded through .gitignore. PostgreSQL, Redis, and MinIO development services will be configured separately through Docker Compose during the infrastructure setup phase.

## Features

- Asynchronous background job processing
- BullMQ queues backed by Redis
- Automatic exponential-backoff retries
- Dead Letter Queue (DLQ) for failed jobs
- JWT authentication with refresh-token rotation
- HttpOnly, SameSite refresh-token cookies
- Refresh-token reuse detection and session revocation
- WebSocket-based real-time task updates
- Redis Pub/Sub for event synchronization
- Redis Cache-Aside strategy
- Sliding-window API rate limiting
- Cursor-based pagination
- AWS S3 presigned URLs for direct file uploads

## Architecture

    React Client
         |
     HTTPS / WSS
         |
    Nginx Reverse Proxy
         |
         +------------------+
         |                  |
      REST API          WebSockets
         |                  |
    Node.js API       WebSocket Server
         |                  |
         +--------+---------+
                  |
         +--------+---------+
         |        |         |
      PostgreSQL Redis   Redis Pub/Sub
         |        |         |
         |      Cache    Event Bridge
         |
         +------------------+
                  |
             BullMQ Queue
                  |
          Background Workers
                  |
               AWS S3

## Tech Stack

| Layer          | Technology             |
| -------------- | ---------------------- |
| Runtime        | Node.js                |
| Language       | TypeScript             |
| Database       | PostgreSQL             |
| ORM            | Prisma / Drizzle       |
| Cache & Broker | Redis                  |
| Queue          | BullMQ                 |
| Real-Time      | WebSockets / Socket.io |
| Storage        | AWS S3 / MinIO         |
| Authentication | JWT                    |
| Reverse Proxy  | Nginx                  |
| Infrastructure | Docker                 |

## Core Modules

### Authentication

Uses 15-minute access JWTs and 7-day refresh tokens stored in HttpOnly, SameSite cookies. Refresh tokens are rotated and revoked when reuse is detected.

### Queue & Worker Engine

Background operations such as CSV exports and PDF generation are processed through BullMQ. Failed jobs receive up to three attempts using exponential backoff before being moved to the DLQ.

### Real-Time Synchronization

Workers publish task status changes through Redis Pub/Sub. The WebSocket server subscribes to these events and broadcasts updates to connected clients.

### Caching & Rate Limiting

Redis provides Cache-Aside caching for dashboard metadata and sliding-window rate limiting of 100 requests per 15 minutes per IP/user.

## API

    POST /api/v1/auth/login
    POST /api/v1/auth/refresh
    GET  /api/v1/projects/:id/tasks
    POST /api/v1/tasks/export
    POST /api/v1/attachments/presigned-url

POST /api/v1/tasks/export immediately returns `202 Accepted` with a `jobId`, allowing the export to run asynchronously.

## Project Goal

Taskly demonstrates an industry-oriented backend architecture using event-driven processing, distributed queues, real-time communication, secure authentication, caching, rate limiting, and cloud-based file storage.
