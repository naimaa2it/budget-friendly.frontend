YourHaat frontend — Admin auth and dashboard

This project uses Firebase on the frontend for authentication (email/password + Google for normal users) and your backend for server-side sessions (JWT cookie). Below are instructions for the admin/moderator flow that uses email/password and a server-side secret.

Admin login (/adminlogin)

- Route: `/adminlogin` (page added at `app/(main)/auth/adminlogin/page.jsx`).
- Purpose: allow signing in administrator/moderator accounts using email + password and a server-side secret code. **Registration is not exposed on the frontend; admin accounts must be created manually.**
- Fields (login): `email`, `password`, `secret code`.

How it works (summary)

1. Frontend logs in the user with Firebase Auth (client-side) using `signInWithEmailAndPassword`.
2. Frontend calls backend admin login endpoint:
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


### UI enhancements

A new `EmptyState` component was added in `components/common/EmptyState.jsx` to consolidate empty‑page layouts (cart, wishlist, etc.).
It now includes a small Lottie animation by default. To enable this you will need to install the animation package:

```bash
cd yourhaatfrontend
npm install lottie-react
``` 

You can override the animation via `animationUrl` or `animationData` props when rendering the component.

---

### Category management updates

The dashboard now provides a simplified, three-level category interface:
1. **Main category** (top-level) – created with no parent.
2. **Subcategory** – choose a parent main category.
3. **Sub‑subcategory** – choose a parent subcategory.

When you open the create/edit page, the form presents a chain of dropdowns so you can easily position a new item in the hierarchy. The underlying Mongo collection remains simple (`name`, `parent`, optional `level`/`slug`), and the backend computes `level` automatically. Inline child‑management UI has been removed in favor of the cleaner parent-selection flow.

This keeps the data model straightforward while letting you build out three-tiered category trees. If you need deeper nesting, create the deeper category by selecting its immediate parent when you add it.

