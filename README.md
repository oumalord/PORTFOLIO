# Software Engineer / IT Professional Portfolio

A single-page portfolio with an admin panel at `/#/admin`.

Page order: Hero and stats, About, Services (with Skills underneath), Projects, Experience,
Education and certifications, Contact call-to-action, Partners banner (shown only when an image is set).

## Project layout
- `src/Site.tsx` - public website
- `src/Admin.tsx` - password-protected admin panel and content editor
- `src/content.ts` - content model, defaults, image compression and data hook
- `src/extras.ts` - section order/hide, custom sections, skills, projects, experience, certifications, downloads, labels, favicon, custom CSS
- `src/extra.css` - styles for engineer sections and custom sections
- `src/index.css` - base site styles
- `api/index.ts` - API, admin password authentication, Neon persistence and media uploads
- `backend/server.ts` - local API server entrypoint
- `tests/tests.json` - smoke-test scenarios

## Services
Seven services are listed by default. Each shows an icon preview panel; upload an image in the admin to replace it.

## Projects section
Each project card shows a preview image and opens the project in a new tab when clicked.
The preview is generated automatically from the project link (WordPress mShots screenshot service).
Upload your own screenshot in the admin to override it.

## Run locally with Neon

1. Create a Neon project and copy its pooled or direct connection string.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to that connection string. Keep `sslmode=require`.
3. Set `ADMIN_PASSWORD` to a strong password and `SESSION_SECRET` to a separate random secret.
4. Install dependencies with `npm install`, then start the app with `npm run dev`.
5. Open the Vite URL printed in the terminal and visit `/#/admin` to sign in.

The API creates the `portfolio_content` and `portfolio_media` tables on startup. Content is stored
as JSONB; uploaded media is stored in Neon as binary data. The media table can grow substantially
as you add large files, so keep uploads within the editor's size limits. Never commit `.env`.

For Vercel, the `api/index.ts` function handles the API routes through rewrites in `vercel.json`.
For a traditional Node host, run `npm run build` for the frontend and `npm start` for the API, and
configure the host or reverse proxy to forward `/api` requests to it.

## Using the admin
1. Open `/#/admin` and enter the `ADMIN_PASSWORD` configured on the server.
2. Edit any tab, then click "Save changes".

Uploads: images are resized in the browser; PDF/MP4/WebM must be under about 4 MB
(for bigger videos paste a YouTube or Vimeo link instead).
