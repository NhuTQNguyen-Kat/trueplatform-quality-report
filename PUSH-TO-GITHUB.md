# Push code lên GitHub

## Đã làm sẵn
- ✅ Git đã được init
- ✅ Commit đầu tiên đã tạo
- ✅ `.env.local` và `data/cache.json` đã được exclude (không push lên)

## Bước tiếp theo — BẠN CẦN LÀM

### 1. Tạo repository mới trên GitHub

1. Vào: **https://github.com/new**
2. Điền:
   - **Repository name:** `trueplatform-quality-report` (hoặc tên khác)
   - **Visibility:** Public
   - **Không** chọn "Add a README" (đã có sẵn)
3. Click **Create repository**

### 2. Push code lên GitHub

Chạy các lệnh sau trong terminal (thay `REPO_NAME` bằng tên repo bạn vừa tạo):

```bash
cd "/Users/nhu.tqnguyen/Documents/Quality Report"

# Thêm remote (thay trueplatform-quality-report nếu bạn đặt tên khác)
git remote add origin https://github.com/NhuTQNguyen-Kat/trueplatform-quality-report.git

# Push
git push -u origin main
```

### 3. Nếu cần đăng nhập

- **HTTPS:** GitHub sẽ yêu cầu username + **Personal Access Token** (không dùng password)
- Tạo token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Quyền cần: `repo`

- **SSH:** Nếu đã cấu hình SSH key:
  ```bash
  git remote set-url origin git@github.com:NhuTQNguyen-Kat/trueplatform-quality-report.git
  git push -u origin main
  ```
