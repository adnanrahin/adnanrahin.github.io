# [adnanrahin.github.io](http://adnanrahin.github.io)

Personal site and technical blog for **Adnan Habib Rahin** — Senior Software Engineer.

Live site: [https://adnanrahin.github.io](https://adnanrahin.github.io)

## Structure


| Path                 | Purpose                                                        |
| -------------------- | -------------------------------------------------------------- |
| `/`                  | Profile (always the landing page) + links to all blog sections |
| `/system-design/`    | Distributed systems, scalability, architecture                 |
| `/llm/`              | Generative AI, RAG, LangChain, Bedrock                         |
| `/devops/`           | CI/CD, IaC, Kubernetes, cloud ops                              |
| `/data-structures/`  | Algorithms and CS fundamentals                                 |
| `/data-engineering/` | Spark, Airflow, Databricks, ETL                                |




## Add a new blog post

1. Create a Markdown file in the matching collection folder:
  ```
   _system-design/my-new-post.md
   _llm/my-new-post.md
   _devops/my-new-post.md
   _data-structures/my-new-post.md
   _data-engineering/my-new-post.md
  ```
2. Add front matter:
  ```yaml
   ---
   title: My Post Title
   date: 2026-03-15
   description: One-line summary for listings.
   tags: [optional, tags]
   ---
  ```
3. Write content in Markdown below the front matter.
4. Commit and push — GitHub Pages builds automatically.



## Update your profile

Edit `_data/profile.yml` — name, bio, skills, experience, and social links all live there.

## Add a new blog section

1. Add a collection in `_config.yml`
2. Add an entry in `_data/sections.yml`
3. Create `{section-slug}/index.html` using an existing category page as a template
4. Create `_` + `{section-slug}/` folder for posts



## Local development

You need either **Docker** (easiest on Windows) or **Ruby** installed.

### Option A — Docker (recommended, no Ruby install)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

**PowerShell:**
```powershell
cd C:\Users\rahin\source-code\github.io\adnanrahin.github.io
.\serve.ps1
```

**Git Bash / WSL:**
```bash
./serve.sh
```

**Or manually:**
```bash
docker compose run --rm jekyll bundle install
docker compose up
```

Open [http://localhost:4000](http://localhost:4000)

### Option B — Install Ruby (native)

`bundle: command not found` means Ruby/Bundler is not installed.

1. Download **Ruby+Devkit** from [rubyinstaller.org](https://rubyinstaller.org/downloads/) (Ruby 3.2.x or 3.3.x)
2. Run the installer — check **"Add Ruby to PATH"**
3. Open a **new** terminal and run:
   ```bash
   gem install bundler
   cd path/to/adnanrahin.github.io
   bundle install
   bundle exec jekyll serve
   ```

> Chocolatey (`choco install ruby.install`) requires an **Administrator** terminal on Windows.

Open [http://localhost:4000](http://localhost:4000)

## Deploy

Push to the `main` branch on GitHub. Enable **Settings → Pages → Source: Deploy from branch → main / (root)** if not already configured.