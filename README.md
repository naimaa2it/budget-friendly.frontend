YourHaat frontend — Admin auth and dashboard

This project uses Firebase on the frontend for authentication (email/password + Google for normal users) and your backend for server-side sessions (JWT cookie). Below are instructions for the admin/moderator flow that uses email/password and a server-side secret.

Admin login/register (/adminlogin)

- Route: `/adminlogin` (page added at `app/(main)/auth/adminlogin/page.jsx`).
- Purpose: allow creating and signing in admin/moderator accounts using email + password and a server-side secret code.
- Fields (register): `name`, `email`, `password`, `role` (admin | moderator), `secret code`.
- Fields (login): `email`, `password`, `secret code`.

How it works (summary)

1. Frontend registers/logs in the user with Firebase Auth (client-side) using `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`.
2. Frontend calls backend admin endpoints to create / verify the admin record:
   - `POST /api/admin/register` — creates admin in MongoDB (server verifies the secret code, stores hashed password).
   - `POST /api/admin/login` — backend verifies credentials + secret code and sets JWT cookie.
3. On successful backend login the app calls `GET /api/auth/me` (via `UserContext`) to populate the logged-in user, and then redirects to `/dashabord`.

Security notes

- The secret code is validated only on the server (`process.env.ADMIN_SECRET`). Do NOT hard-code the secret in the frontend; the frontend only sends the value the user types.
- Backend stores a hashed password for admin accounts (`routes/admin.js`). The server also expects the secret code when registering or logging in as admin.
- Current implementation creates the admin in both Firebase Auth (client-side) and your backend user collection; backend remains the source of truth for role and session cookie.

Environment variables

- NEXT_PUBLIC_API_URL — frontend API base URL (used by pages)
- For backend (see backend README):
  - ADMIN_SECRET — secret code that admin registration/login must provide
  - JWT_SECRET — JWT signing secret
  - MONGODB_URI / MONGO_URI — MongoDB connection string

Files added / changed

- `app/(main)/auth/adminlogin/page.jsx` — admin login/register UI & Firebase usage
- `app/(main)/dashabord/page.jsx` — simple protected dashboard (checks `user.role`)
- `components/authentication/AuthModal.jsx` — existing user auth improvements were previously made

Next steps / suggestions

- (Recommended) Verify Firebase ID tokens on the backend for stronger trust between Firebase and your server.
- Add server-side routes to manage admin-only actions (user management, settings) and protect them by role.

