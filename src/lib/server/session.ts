import { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

// セッションデータにdataプロパティを経由してアクセスするための型
// セッションデータを一括書き換えしたり、データの存在チェックを行う際に便利
type SessionContainer<T extends Record<string, unknown>> = {
  data?: T;
};

async function getSession<T extends Record<string, unknown>>(
  options: SessionOptions
) {
  return getIronSession<SessionContainer<T>>(await cookies(), options);
}

// 認証用セッション
export type AuthSessionData = {
  state: string; // CSRF対策のためのstate
  code_verifier: string; // PKCE(+CSRF対策)のためのcode_verifier
  nonce: string; // OIDCのnonce
};

export const authSessionOptions: SessionOptions = {
  cookieName: "auth_session",
  password: process.env.SESSION_PASSWORD!,
  ttl: 10 * 60, // 10分(セキュアにするため短め)
};

export async function getAuthSession() {
  return getSession<AuthSessionData>(authSessionOptions);
}

// ログインセッション
export type LoginSessionData = {
  id: string;
};

export const loginSessionOptions: SessionOptions = {
  cookieName: "login_session",
  password: process.env.SESSION_PASSWORD!,
  ttl: 7 * 24 * 60 * 60, // 7日(ユーザー体験向上のため長め)
};

export async function getLoginSession() {
  return getSession<LoginSessionData>(loginSessionOptions);
}
