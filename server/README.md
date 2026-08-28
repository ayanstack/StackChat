# AI Chat Board — Backend API

A production-grade, ChatGPT-inspired chat application backend built with Node.js, Express, MongoDB, and Google Gemini AI.

## Features

- **Authentication** — JWT access/refresh token rotation, register, login, logout, forgot/reset password
- **Conversations** — Create, list, search, pin, favorite, archive, rename, delete
- **Messages** — Send (with automatic AI reply), edit, delete, regenerate AI response, full-text search
- **Real-time Chat** — Socket.IO with JWT auth, streaming AI responses (typing effect), typing indicators
- **AI Integration** — Google Gemini, provider-agnostic architecture for easy swapping
- **AI Utilities** — Explain code, summarize, translate, rewrite, fix grammar, custom prompts
- **File Uploads** — Images, PDF, DOCX, TXT via Cloudinary, automatic text extraction for AI context
- **User Management** — Profile, avatar, password, settings, account deactivation
- **Folders** — Organize conversations into folders
- **Analytics** — Personal usage stats (messages, tokens, files)
- **Admin Panel** — Dashboard stats, user management, ban/unban

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| File Storage | Cloudinary |
| AI Provider | Google Gemini (REST API) |
| Real-time | Socket.IO |
| Security | Helmet, CORS, express-rate-limit, express-mongo-sanitize |
| Logging | Winston + Morgan |
| Password Hashing | bcryptjs |
| Text Extraction | pdf-parse, mammoth |

## Architecture

Clean Architecture / MVC pattern:

```
Route → Middleware (auth/validation) → Controller → Service → Model → Database
```

- **Routes** define URL structure only
- **Controllers** are thin — extract request data, call services, format responses
- **Services** contain all business logic
- **Models** define MongoDB schemas via Mongoose

Every response follows a consistent shape:
```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": [] }
```

## Project Structure

```
src/
├── ai/                  # AI provider abstraction (Gemini, extensible)
├── config/               # Environment & Cloudinary config
├── constants/             # HTTP status codes, enums
├── controllers/           # Request handlers
├── database/              # MongoDB connection
├── helpers/               # JWT token helpers
├── logger/                # Winston logger setup
├── middlewares/           # Auth, validation, security, upload, error handling
├── models/                # Mongoose schemas
├── routes/                # Express routers
├── services/               # Business logic
├── sockets/                # Socket.IO real-time handlers
├── utils/                  # ApiResponse, ApiError, asyncHandler
├── validations/            # Zod schemas
├── app.js                  # Express app setup
└── server.js                # Entry point
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)
- Google Gemini API key (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
NODE_ENV=development
PORT=5000
API_VERSION=v1
CLIENT_URL=http://localhost:3000

MONGO_URI=<your MongoDB Atlas connection string>

JWT_ACCESS_SECRET=<random secret string>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=<random secret string>
JWT_REFRESH_EXPIRY=7d

COOKIE_SECRET=<random secret string>
BCRYPT_SALT_ROUNDS=10

CLOUDINARY_CLOUD_NAME=<your Cloudinary cloud name>
CLOUDINARY_API_KEY=<your Cloudinary API key>
CLOUDINARY_API_SECRET=<your Cloudinary API secret>

AI_PROVIDER=gemini
GEMINI_API_KEY=<your Gemini API key>

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

### Run

```bash
npm run dev    # development, auto-restarts on file changes
npm start      # production
```

Server runs at `http://localhost:5000`. Health check: `GET /health`.

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`.

### Auth (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create account |
| POST | `/login` | Login |
| POST | `/refresh-token` | Get new access token |
| POST | `/logout` | Revoke refresh token |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |
| GET | `/me` | Get current user (protected) |

### Users (`/users`) — all protected
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Get profile |
| PATCH | `/profile` | Update name |
| PATCH | `/password` | Change password |
| POST | `/avatar` | Upload avatar (multipart) |
| PATCH | `/settings` | Update theme/language/AI defaults |
| DELETE | `/account` | Deactivate account |

### Conversations (`/conversations`) — all protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create |
| GET | `/` | List (paginated, searchable) |
| GET | `/:id` | Get one |
| PATCH | `/:id/rename` | Rename |
| DELETE | `/:id` | Soft delete |
| PATCH | `/:id/pin` | Toggle pin |
| PATCH | `/:id/favorite` | Toggle favorite |
| PATCH | `/:id/archive` | Toggle archive |
| POST | `/:conversationId/messages` | Send message (AI replies automatically) |
| GET | `/:conversationId/messages` | List messages in conversation |

### Messages (`/messages`) — all protected
| Method | Endpoint | Description |
|---|---|---|
| GET | `/search?q=` | Full-text search across your messages |
| PATCH | `/:id` | Edit message |
| DELETE | `/:id` | Delete message |
| POST | `/:id/regenerate` | Regenerate an AI response |

### Files (`/files`) — all protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Upload (multipart, field name `file`) |
| GET | `/` | List your files |
| GET | `/:id` | Get one (includes extracted text) |
| DELETE | `/:id` | Delete |

### AI Utilities (`/ai`) — all protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/explain-code` | Explain code snippet |
| POST | `/summarize` | Summarize text |
| POST | `/translate` | Translate text |
| POST | `/rewrite` | Rewrite text |
| POST | `/fix-grammar` | Fix grammar |
| POST | `/custom-prompt` | One-off custom AI call |

### Folders (`/folders`) — all protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create folder |
| GET | `/` | List folders |
| PATCH | `/:id` | Update folder |
| DELETE | `/:id` | Delete folder |
| PATCH | `/conversations/:id/move` | Move conversation to folder |

### Analytics (`/analytics`) — all protected
| Method | Endpoint | Description |
|---|---|---|
| GET | `/me` | Your usage stats |
| GET | `/me/daily?days=7` | Daily message counts |

### Admin (`/admin`) — requires `role: admin`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Platform-wide stats |
| GET | `/users` | List all users |
| GET | `/users/:id` | User detail |
| PATCH | `/users/:id/ban` | Deactivate a user |
| PATCH | `/users/:id/unban` | Reactivate a user |

## Real-time (Socket.IO)

Connect with `?token=<accessToken>` in the connection URL or `auth: { token }` in the client.

| Event (client emits) | Payload | Description |
|---|---|---|
| `join_conversation` | `conversationId` | Join a conversation's room |
| `leave_conversation` | `conversationId` | Leave a room |
| `typing` / `stop_typing` | `conversationId` | Typing indicator |
| `send_message` | `{ conversationId, content }` | Send message, triggers streaming AI reply |

| Event (server emits) | Payload | Description |
|---|---|---|
| `joined_conversation` | `{ conversationId, room, message }` | Confirms room join |
| `new_message` | Message object | The user's message, broadcast to the room |
| `message_chunk` | `{ conversationId, chunk }` | A piece of the AI's streaming reply |
| `message_complete` | Message object | The complete, saved AI reply |
| `user_typing` / `user_stop_typing` | `{ userId, userName }` | Someone else is typing |
| `error` | `{ message }` | Something went wrong |

## Security Notes

- Passwords are hashed with bcrypt, never stored in plaintext
- Access tokens expire in 15 minutes; refresh tokens rotate on use and are revocable
- Rate limiting on auth routes to slow brute-force attempts
- NoSQL injection protection via `express-mongo-sanitize`
- Secure HTTP headers via Helmet
- All user-owned resources (conversations, messages, files, folders) are scoped by `user` ID on every query — users can never access each other's data

## Known Limitations / Not Yet Implemented

- Image analysis via Gemini Vision (images upload successfully but aren't AI-analyzed yet)
- Email delivery for password resets (dev mode returns the token directly in the API response instead)
- Notifications system
- Automated tests

## License

Private project.
