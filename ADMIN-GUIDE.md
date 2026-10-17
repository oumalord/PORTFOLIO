# Admin panel guide

Open `/#/admin` on your site. The editor is in `src/Admin.tsx`; its protected API is in
`api/index.ts`.

1. Enter the `ADMIN_PASSWORD` configured in the server environment. The password is never stored in the database.
2. Use the tabs to edit the site: Layout, Theme, Hero, Services, About, Projects, Experience,
   Education & certs, Contact, Social, Footer, Custom sections and Advanced.
3. Upload images, PDFs and short MP4/WebM videos (about 4 MB max; use a YouTube/Vimeo link for larger videos).
4. Click "Save changes". The saved content and uploaded media are stored in Neon.

The API enforces the admin session on content writes and uploads. Set a strong `SESSION_SECRET`
alongside `ADMIN_PASSWORD` in the server environment. See [README.md](./README.md) for setup instructions.
