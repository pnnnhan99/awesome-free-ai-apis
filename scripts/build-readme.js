const fs = require("fs");
const axios = require("axios");
const path = require("path");

// Paths to data and output files
const APIS_FILE = path.join(__dirname, "..", "data", "ai-apis.json");
const README_EN = path.join(__dirname, "..", "README.md");
const README_VI = path.join(__dirname, "..", "README.vi.md");

// Status labels
const STATUS_ONLINE = "🟢 Online";
const STATUS_OFFLINE = "🔴 Offline";

// Browser-like headers to avoid bot detection / Cloudflare blocks
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Connection": "keep-alive",
};

/**
 * Convert a category name to a URL-friendly slug.
 * Matches GitHub's anchor generation: lowercase, replace non-alphanumeric with hyphens.
 * @param {string} text - The category name
 * @returns {string} URL slug
 */
function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Ping an API's URL to check if it's online.
 * HTTP status < 500 (including 403 from Cloudflare) = Online.
 * Timeout, DNS error, or status >= 500 = Offline.
 * @param {object} api - API object with url field
 * @returns {Promise<{status: string, httpCode: string|number}>}
 */
async function checkAPI(api) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await axios({
      method: "GET",
      url: api.url,
      timeout: 8000,
      headers: BROWSER_HEADERS,
      validateStatus: () => true,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status >= 500) {
      return { status: STATUS_OFFLINE, httpCode: res.status };
    }
    return { status: STATUS_ONLINE, httpCode: res.status };
  } catch (err) {
    return { status: STATUS_OFFLINE, httpCode: "error" };
  }
}

/**
 * Group APIs by their category field.
 * @param {Array} apisWithStatus - Array of API objects with added status field
 * @returns {Object} Object keyed by category name
 */
function groupByCategory(apisWithStatus) {
  const groups = {};
  for (const item of apisWithStatus) {
    const cat = item.api.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

/**
 * Generate the English README.md content.
 * @param {Array} apisWithStatus - Array of API objects with status info
 * @param {number} online - Count of online APIs
 * @param {number} offline - Count of offline APIs
 * @param {string} now - Formatted date string
 * @returns {string} Complete markdown content in English
 */
function generateEnglishMarkdown(apisWithStatus, online, offline, now) {
  const total = apisWithStatus.length;
  const groups = groupByCategory(apisWithStatus);

  let md = `# 🤖 Awesome Free AI APIs

[![Total APIs](https://img.shields.io/badge/Total_APIs-${total}-blue?style=for-the-badge)](https://github.com/pnnnhan99/awesome-free-ai-apis)
[![Online](https://img.shields.io/badge/Online-${online}-brightgreen?style=for-the-badge)](https://github.com/pnnnhan99/awesome-free-ai-apis)
[![Auto Update](https://img.shields.io/badge/Auto_Update-Active-purple?style=for-the-badge&logo=github-actions)](https://github.com/pnnnhan99/awesome-free-ai-apis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

> 🎯 **The best Free Tier AI APIs collection** for Vibe Coders and Developers. No more searching for test APIs only to be forced to enter a credit card!
>
> 🤝 **Want to contribute?** Open a Pull Request or create an Issue to suggest a new API!

## 📋 Overview

| Metric | Value |
|---|---|
| Total APIs | ${total} |
| 🟢 Online | ${online} |
| 🔴 Offline | ${offline} |
| Last Updated | ${now} (GMT+7) |

---

## 📂 Table of Contents

`;

  for (const category of Object.keys(groups)) {
    md += `- [${category}](#${slug(category)})\n`;
  }

  md += `\n---\n\n`;

  for (const [category, items] of Object.entries(groups)) {
    md += `### ${category}\n\n`;
    md += `| AI API (Linked) | Free Tier Details | Requires Credit Card? | Website Status |\n`;
    md += `|---|---|---|---|\n`;

    for (const item of items) {
      md += `| [${item.api.name}](${item.api.url}) | ${item.api.freeTier} | ${item.api.requireCC} | ${item.status} |\n`;
    }

    md += `\n---\n\n`;
  }

  md += `## 📝 Notes

- **Website Status** is automatically checked every night by GitHub Actions.
- 🟢 Online: Server responds (status < 500). Note: HTTP 403 (Cloudflare) still counts as Online because the server is alive.
- 🔴 Offline: Timeout, DNS error, or server error (status >= 500).
- **Requires Credit Card**: 🔴 Yes = requires card on signup. 🟢 No = no card required.
- All contributions welcome via PR at [GitHub](https://github.com/pnnnhan99/awesome-free-ai-apis).

---

<p align="center">
  Made with 💜 by the <a href="https://github.com/pnnnhan99/awesome-free-ai-apis">Awesome Free AI APIs</a> community
</p>

<p align="center">
  🕐 Last updated: ${now}
</p>
`;

  return md;
}

/**
 * Generate the Vietnamese README.vi.md content.
 * @param {Array} apisWithStatus - Array of API objects with status info
 * @param {number} online - Count of online APIs
 * @param {number} offline - Count of offline APIs
 * @param {string} now - Formatted date string
 * @returns {string} Complete markdown content in Vietnamese
 */
function generateVietnameseMarkdown(apisWithStatus, online, offline, now) {
  const total = apisWithStatus.length;
  const groups = groupByCategory(apisWithStatus);

  let md = `# 🤖 Awesome Free AI APIs

[![Tổng số APIs](https://img.shields.io/badge/Total_APIs-${total}-blue?style=for-the-badge)](https://github.com/pnnnhan99/awesome-free-ai-apis)
[![Đang hoạt động](https://img.shields.io/badge/Online-${online}-brightgreen?style=for-the-badge)](https://github.com/pnnnhan99/awesome-free-ai-apis)
[![Cập nhật tự động](https://img.shields.io/badge/Auto_Update-Active-purple?style=for-the-badge&logo=github-actions)](https://github.com/pnnnhan99/awesome-free-ai-apis)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

> 🤖 **Danh sách các AI API có gói Free Tier hào phóng nhất** dành cho Vibe Coder và Developers. Không còn nỗi đau đi tìm API test rồi bị bắt nhập thẻ Visa!
>
> 🤝 **Bạn muốn đóng góp?** Hãy mở một Pull Request hoặc tạo Issue để gợi ý API mới!

## 📋 Tổng quan

| Chỉ số | Giá trị |
|---|---|
| Tổng số APIs | ${total} |
| 🟢 Đang hoạt động | ${online} |
| 🔴 Không phản hồi | ${offline} |
| Cập nhật lần cuối | ${now} (GMT+7) |

---

## 📂 Mục lục

`;

  for (const category of Object.keys(groups)) {
    md += `- [${category}](#${slug(category)})\n`;
  }

  md += `\n---\n\n`;

  for (const [category, items] of Object.entries(groups)) {
    md += `### ${category}\n\n`;
    md += `| Tên AI (Gắn link) | Chi tiết gói Free Tier | Cần thẻ tín dụng (CC)? | Trạng thái web |\n`;
    md += `|---|---|---|---|\n`;

    for (const item of items) {
      md += `| [${item.api.name}](${item.api.url}) | ${item.api.freeTier} | ${item.api.requireCC} | ${item.status} |\n`;
    }

    md += `\n---\n\n`;
  }

  md += `## 📝 Ghi chú

- **Trạng thái web** được kiểm tra tự động mỗi đêm bởi GitHub Actions.
- 🟢 Online: Server phản hồi (status < 500). Lưu ý: HTTP 403 (Cloudflare) vẫn tính là Online vì server đang sống.
- 🔴 Offline: Timeout, DNS error, hoặc server lỗi (status >= 500).
- **Cần thẻ tín dụng (CC)**: 🔴 Yes = yêu cầu nhập thẻ khi đăng ký. 🟢 No = không yêu cầu.
- Mọi đóng góp xin gửi PR tại [GitHub](https://github.com/pnnnhan99/awesome-free-ai-apis).

---

<p align="center">
  Made with 💜 bởi cộng đồng <a href="https://github.com/pnnnhan99/awesome-free-ai-apis">Awesome Free AI APIs</a>
</p>

<p align="center">
  🕐 Last updated: ${now}
</p>
`;

  return md;
}

/**
 * Main entry point: load data, check statuses, generate both READMEs.
 */
async function main() {
  console.log("🚀 Starting build-readme.js...");
  console.log(`📂 Reading APIs from: ${APIS_FILE}`);

  const raw = fs.readFileSync(APIS_FILE, "utf-8");
  const apis = JSON.parse(raw);
  console.log(`✅ Loaded ${apis.length} APIs.`);

  console.log("\n🔍 Checking API status (timeout: 8s each)...");
  const results = [];

  for (const api of apis) {
    console.log(`  ⏳ Checking: ${api.name} (${api.url})...`);
    const result = await checkAPI(api);
    results.push({ api, ...result });
    console.log(`  ✅ ${api.name}: ${result.status} (${result.httpCode})`);
  }

  const onlineCount = results.filter((r) => r.status === STATUS_ONLINE).length;
  const offlineCount = results.length - onlineCount;
  const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });
  console.log(`\n📊 Results: ${onlineCount}/${results.length} APIs are online.`);

  // Generate and write both README files
  console.log("✨ Generating README.md (English) and README.vi.md (Vietnamese)...");

  const markdownEN = generateEnglishMarkdown(results, onlineCount, offlineCount, now);
  fs.writeFileSync(README_EN, markdownEN, "utf-8");
  console.log(`✅ README.md written (English).`);

  const markdownVI = generateVietnameseMarkdown(results, onlineCount, offlineCount, now);
  fs.writeFileSync(README_VI, markdownVI, "utf-8");
  console.log(`✅ README.vi.md written (Vietnamese).`);

  // Check if content changed
  const currentEN = fs.existsSync(README_EN) ? fs.readFileSync(README_EN, "utf-8") : "";
  const currentVI = fs.existsSync(README_VI) ? fs.readFileSync(README_VI, "utf-8") : "";
  const changedEN = currentEN !== markdownEN;
  const changedVI = currentVI !== markdownVI;

  if (changedEN) console.log("🔄 README.md has been updated.");
  else console.log("ℹ️  README.md content unchanged.");
  if (changedVI) console.log("🔄 README.vi.md has been updated.");
  else console.log("ℹ️  README.vi.md content unchanged.");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
