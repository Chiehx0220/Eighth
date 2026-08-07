# CMS OAuth Proxy (Cloudflare Worker)

讓 `/admin` 的 Decap CMS 能用真正的 GitHub 帳號登入(取代 `local_backend`)。

## 1. 建立 GitHub OAuth App

GitHub → Settings → Developer settings → OAuth Apps → New OAuth App

- Homepage URL: `https://chiehx0220.github.io/Eighth/`
- Authorization callback URL: `https://eighth-cms-oauth.<你的-subdomain>.workers.dev/callback`
  (subdomain 在第一次 `wrangler deploy` 後才知道,可以先隨便填,部署完再回來改)

建立後取得 **Client ID** 和 **Client Secret**。

## 2. 部署 Worker

```bash
cd cms-oauth-worker
npm install
npx wrangler login
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler deploy
```

`wrangler deploy` 完成後會印出 Worker 網址,例如
`https://eighth-cms-oauth.<你的-subdomain>.workers.dev`。

若這個網址跟第 1 步填的 callback URL 不一樣,回 GitHub OAuth App 設定改成
`<worker網址>/callback`。

## 3. 更新 CMS 設定

編輯 `../src/admin/config.yml`,把 `base_url` 改成 Worker 的網址(不含 `/callback`):

```yaml
backend:
  name: github
  repo: Chiehx0220/Eighth
  branch: main
  base_url: https://eighth-cms-oauth.<你的-subdomain>.workers.dev
  auth_endpoint: auth
```

`local_backend: true` 可以留著 —— 它只在用 `localhost` 開啟 `/admin` 時生效,正式網址上不受影響。

## 4. commit + push

改完 `config.yml` 後 push 到 `main`,GitHub Actions 部署完成後,`/admin` 登入畫面按下
「Login with GitHub」就會跳出真正的 GitHub 授權視窗。
