# oidc-sample
<img width="50%" alt="ログイン画面スクリーンショット" src="https://github.com/user-attachments/assets/98a5aa98-d4c2-4eac-bf65-d705fdf942fe" />

Next.jsを使用した**OpenID Connect (OIDC)** の認可コードフロー+PKCEの学習目的のサンプル実装。

IdPとの連携から `state` / `nonce` / `code_verifier(PKCE)` の管理、`id_token` の署名検証まで、OIDC の基本的な構成要素を最小限のライブラリで構築しています。


### 🔰 注意事項

- このリポジトリは学習用途専用であり**本番環境での利用は非推奨**です。
- 想定実行環境は**ローカル環境のみ**です

---

## 🌐 エンドポイント一覧
| エンドポイント               | 説明                                          |
|------------------------------|-----------------------------------------------|
| `/`                          | トップページ。ログイン/ログアウトボタンを表示            |
| `/api/auth/login`            | OIDCプロバイダの認可エンドポイントにリダイレクト |
| `/api/auth/callback`         | OIDCプロバイダから認可コードを受け取りIDトークンと交換、ログイン処理    |
| `/api/auth/logout`           | セッションを破棄し、OIDCプロバイダのログアウトエンドポイントにリダイレクト |

## ✅ 実装済み機能の概要

| 機能                   | 状態  | 説明                                          | 補足      |
|------------------------|-------|-----------------------------------------------|-----------------------------|
| 認可コードフロー       | ✅    | OIDC準拠のフロー。code + PKCE を実装          | -                           |
| PKCE (`code_verifier`) | ✅    | `code_challenge`生成 + `code_verifier`保存    | `pkce-challenge`                          |
| `state` 検証           | ✅    | CSRF対策としてランダム文字列を保存・検証      |  -             |
| `nonce` 検証           | ✅    | IDトークンのリプレイ攻撃防止に使用            | -              |
| `id_token` の署名検証  | ✅    | JWKから公開鍵を取得して署名検証               | `jose`                      |
| claim 検証             | ✅    | `iss`, `aud`, `exp`, `nonce` などを検証       | `jose` + 手動検証           |
| セッション管理         | ✅    | Cookieベースでログイン状態を保持              | `iron-session`              |
| ユーザー登録・照合     | ✅    | subとアカウントを紐づけ。未登録の場合はDBに追加  | セッションを擬似DBとして使用                         |
| `/userinfo` 呼び出し    | ⬜️    | 未実装（IDトークンで十分なため省略）| -                           |
| トークン revocation    | ⬜️    | 未実装                          | -                           |

## 🧱 技術スタック

- [Next.js 15](https://nextjs.org/) (App Router)
- TypeScript
- [iron-session](https://github.com/vvo/iron-session)
- [jose](https://github.com/panva/jose)
- [pkce-challenge](https://github.com/crouchcd/pkce-challenge)

---

## 🚀 セットアップ

```bash
git clone https://github.com/ebinase/oidc-sample.git
cd oidc-sample
npm install
```

### 環境変数の設定
`.env.example`を`.env.local` にリネームし、以下の手順で環境変数を設定する

* OIDCプロバイダへのアプリケーションの登録
  * OIDCプロバイダにアプリケーションを登録し、リダイレクトURIを`http://localhost:3000/api/auth/callback`に設定
  * クライアントIDとシークレットを取得
* OIDCプロバイダの`https://your-oidc-provider/.well-known/openid-configuration` から設定を取得
  * `authorization_endpoint` と `token_endpoint`と`jwks_uri`
* SESSION_PASSWORD
  * セッションの暗号化に使用するパスワードを設定

### ローカル環境の起動

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## 参考文献
- [Auth屋 雰囲気OAuthシリーズ3巻](https://authya.booth.pm/)
