# Bhuwan Trivedi — Portfolio (Full Stack)

A portfolio site with a working Node.js + Express backend. All content
(profile, experience, projects) is stored in `server/data/db.json` and
served through a REST API — nothing is hardcoded in the HTML. The contact
form actually submits to the backend and is stored for you to read.

## What's included

- **Public site** (`public/index.html`) — fetches profile, experience, and
  projects from the API on load, and submits the contact form to the backend.
- **Admin panel** (`public/admin.html`) — password-protected page to add or
  delete experience entries and projects, and to view/delete contact
  messages, without touching any code.
- **API** (`server/server.js`) — REST endpoints for everything above, backed
  by a simple JSON file (no external database to install).

## Setup

1. Make sure you have [Node.js](https://nodejs.org) installed (v18+).
2. Install dependencies:
   ```
   cd server
   npm install
   ```
3. (Optional) Set your own admin password instead of the default:
   ```
   export ADMIN_TOKEN="your-own-password"
   ```
   On Windows (cmd): `set ADMIN_TOKEN=your-own-password`
   If you skip this, the default password is `changeme123` — change it before
   deploying anywhere public.
4. Start the server:
   ```
   npm start
   ```
5. Open:
   - Portfolio: http://localhost:4000
   - Admin panel: http://localhost:4000/admin.html (log in with your
     `ADMIN_TOKEN` / the default above)

## Editing content

You can either:
- Use the **admin panel** to add/delete experience and projects, and to view
  contact messages, or
- Edit `server/data/db.json` directly (restart not required — the server
  reads it fresh on every request).

To edit your profile/about text or social links, edit the `profile` object
in `server/data/db.json` directly (there's no profile-editing UI yet).

## How the contact form works

Submitting the form sends a `POST /api/contact` request, which is validated
and appended to `messages` in `db.json`. Open the admin panel to read
messages people send you. This does **not** email you automatically — if you
want email notifications too, the easiest option is to add
[Nodemailer](https://nodemailer.com/) inside the `/api/contact` route in
`server/server.js` with your SMTP credentials.

## Deploying

This is a plain Express app, so it runs on any Node host (Render, Railway,
a VPS, etc.). Two things to change before deploying publicly:
1. Set a strong `ADMIN_TOKEN` environment variable.
2. Note that `db.json` is a file on disk — on hosts with an ephemeral
   filesystem (e.g. some serverless platforms), your data won't persist
   between deploys. A traditional server or container host is simplest.
