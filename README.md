# adnanrahin.github.io

Personal site and technical blog for **Adnan Habib Rahin** — Senior Software Engineer.

Live site: [https://adnanrahin.github.io](https://adnanrahin.github.io)

## Structure

| Path | Purpose |
|------|---------|
| `/` | Profile (landing page) + recent AWS posts |
| `/aws/` | AWS deployment guides and cloud architecture notes |

More sections (System Design, LLM, DevOps, etc.) can be added later — see **Add a new blog section** below.

## Add an AWS post

1. Create a Markdown file in `_aws/`:

   ```
   _aws/my-new-post.md
   ```

2. Add front matter:

   ```yaml
   ---
   title: My Post Title
   date: 2026-03-15
   description: One-line summary for listings.
   tags: [aws, cloudformation]
   ---
   ```

3. Write content in Markdown below the front matter.
4. Commit and push — GitHub Pages builds automatically.

## Update your profile

Edit `_data/profile.yml` — name, bio, skills, experience, projects, and social links.

## Add a new blog section (later)

1. Add a collection in `_config.yml`
2. Add an entry in `_data/sections.yml`
3. Create `{section-slug}/index.html` (copy from `aws/index.html`)
4. Create `_{section-slug}/` folder for posts

## Local development

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

```powershell
cd C:\Users\rahin\source-code\github.io\adnanrahin.github.io
.\serve.ps1
```

Open [http://localhost:4000](http://localhost:4000)

## Deploy

Push to `main`. Enable **Settings → Pages → Deploy from branch → main / (root)**.
