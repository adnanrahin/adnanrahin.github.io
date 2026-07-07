# Personal site & blog

Jekyll site deployed to GitHub Pages.

**Live site:** [adnanrahin.github.io](https://adnanrahin.github.io)

## Site structure

| Path | Purpose |
|------|---------|
| `/` | Profile landing page + recent posts |
| `/aws/` | AWS deployment guides and architecture notes |

## Add an AWS post

Create `_aws/my-new-post.md`:

```yaml
---
title: My Post Title
date: 2026-03-15
description: One-line summary for listings.
tags: [aws, cloudformation]
---

Your content here...
```

Commit and push to `main` - GitHub Actions builds and deploys automatically.

## Update profile

Edit `_data/profile.yml`.

## Add a new section (later)

1. Add a collection in `_config.yml`
2. Add an entry in `_data/sections.yml`
3. Copy `aws/index.html` for the new section page
4. Create `_{section-slug}/` for posts

## Deploy

1. Push to `main`
2. **Settings → Pages → Source:** GitHub Actions
3. **Settings → Actions → Workflow permissions:** Read and write

Workflow: `.github/workflows/pages.yml`

If deploy fails with *"Deployment failed, try again later"*, confirm Pages source is **GitHub Actions** (not branch deploy) and re-run the workflow.
