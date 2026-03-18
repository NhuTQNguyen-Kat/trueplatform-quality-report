# Team JQL Configuration – TruePlatform

Cấu hình JQL cho từng team đã được thiết lập theo yêu cầu. Cần kiểm tra và điều chỉnh nếu cần:

## Teams và nguồn data

| Team | Project | JQL Filter |
|------|---------|------------|
| **Admin Team** | TO | fixVersion = AD.2.0.0 |
| **Manual Team** | TO | fixVersion = MT1.4.0 OR labels = test-case-generator-agent |
| **RA Team** | TO | labels = insight-agent OR parent = TO-12502 OR key = TO-16687 (exclude TO-16746) |
| **Core Team** | TO | labels = test-runner-agent OR fixVersion = Core 1.5.0 OR key IN (TO-16851, TO-17009) |
| **TestCloud Team** | KTC | Playwright report (3.3.0) + TestRunner (3.4.0) + Monitor epic 4655 (3.4.0) |
| **AI Team** | TO | All issues (board 965) |
| **CE Team** | CE | Sprint 46 |
| **WebDev Team** | CE | Sprint 47 |

## Cần xác nhận / điều chỉnh

1. **Katalon TestCloud project key**: Đang dùng `KTC`. Nếu project key khác (vd: `TC`, `KT`), sửa trong `config/team-jql.json` → team `testcloud-team` → `projectKey` và JQL.

2. **Epic Monitor (4655)**: Đang dùng `parent = KTC-4655 OR key = KTC-4655`. Nếu epic key khác (vd: `TC-4655`), sửa trong JQL của TestCloud team.

3. **Sprint 46 / 47**: JQL đang dùng `Sprint = "Sprint 46"` hoặc `Sprint = 46`. Nếu Jira dùng tên sprint khác (vd: `"CE Sprint 46"`), sửa trong `config/team-jql.json` cho CE và WebDev team.

4. **AI Team**: Hiện lấy toàn bộ issues trong project TO. Nếu board 965 có filter riêng (label, component...), thêm điều kiện vào JQL của AI team.

## Cách chạy sync

1. Đảm bảo `.env.local` có `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`.
2. Vào **Data Sync** → **Sync from Jira**.
3. Kiểm tra dữ liệu trên Dashboard và các trang Teams, Bugs.
