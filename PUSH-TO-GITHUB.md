# Push code to GitHub

## Already done
- ✅ Git is initialized
- ✅ Initial commit has been created
- ✅ `.env.local` and `data/cache.json` are excluded (not pushed)

## Next steps — YOU NEED TO DO

### 1. Create a new repository on GitHub

1. Open: **https://github.com/new**
2. Fill in:
   - **Repository name:** `trueplatform-quality-report` (or another name)
   - **Visibility:** Public
   - **Do not** select "Add a README" (already exists)
3. Click **Create repository**

### 2. Push code to GitHub

Run the following commands in terminal (replace `REPO_NAME` with your new repository name):

```bash
cd "/Users/nhu.tqnguyen/Documents/Quality Report"

# Add remote (replace trueplatform-quality-report if needed)
git remote add origin https://github.com/NhuTQNguyen-Kat/trueplatform-quality-report.git

# Push
git push -u origin main
```

### 3. If login is required

- **HTTPS:** GitHub will ask for username + **Personal Access Token** (not password)
- Create token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Required scope: `repo`

- **SSH:** If you already configured an SSH key:
  ```bash
  git remote set-url origin git@github.com:NhuTQNguyen-Kat/trueplatform-quality-report.git
  git push -u origin main
  ```
