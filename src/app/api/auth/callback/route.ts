import * as jose from "jose";
import { getAuthSession, getLoginSession } from "@/lib/server/session";
import { NextResponse } from "next/server";
import { getDB } from "@/lib/server/database";

export enum OIDCError {
  invalid_state = "invalid_state",
  code_verifier_not_found = "code_verifier_not_found",
  token_fetch_failed = "token_fetch_failed",
  invalid_id_token = "invalid_id_token",
  invalid_nonce = "invalid_nonce",
}

// OIDCのコールバックURL
// 認可コードの受取り、idトークンの取得・検証、ログイン処理を行う
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  console.log("searchParams", searchParams);
  const authSession = await getAuthSession();
  console.log("session", authSession);

  // stateの検証
  const inputState = searchParams.get("state");
  const sessionState = authSession.data?.state;

  if (!inputState || !sessionState || inputState !== sessionState) {
    // stateが一致しない場合はCSRF攻撃の可能性があるため、エラーを返す
    console.error("CSRF attack detected: state mismatch");
    authSession.destroy();
    await authSession.save();
    return NextResponse.redirect(
      new URL(`/?error=${OIDCError.invalid_state}`, request.url)
    );
  }
  console.log("stateの確認完了！！");

  // PKCEの存在チェック
  const codeVerifier = authSession.data?.code_verifier;
  if (!codeVerifier) {
    // code_verifierがsessionに存在しない場合はCSRF攻撃の可能性がある
    console.error("PKCE verification failed: code_verifier not found");
    authSession.destroy();
    await authSession.save();
    return NextResponse.redirect(
      new URL(`/?error=${OIDCError.code_verifier_not_found}`, request.url)
    );
  }

  // 認可コードを取得
  const code = searchParams.get("code");

  // idトークンの取得
  const params = new URLSearchParams({
    client_id: process.env.OIDC_CLIENT_ID as string,
    client_secret: process.env.OIDC_CLIENT_SECRET as string,
    redirect_uri: process.env.OIDC_CLIENT_REDIRECT_URI as string,
    code: code as string,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });
  const baseURL = process.env.OIDC_ISSUER_TOKEN_ENDPOINT as string;
  const tokenResponse = await fetch(baseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!tokenResponse.ok) {
    // トークン取得に失敗した場合はPKCEの検証に失敗した可能性が高い
    console.error(
      "Failed to fetch token:",
      `${tokenResponse.status}: ${tokenResponse.statusText}`
    );
    console.error("Response body:", await tokenResponse.json());
    authSession.destroy();
    await authSession.save();
    return NextResponse.redirect(
      new URL(`/?error=${OIDCError.token_fetch_failed}`, request.url)
    );
  }

  const data = await tokenResponse.json();
  console.log(data);

  // idトークンの署名とclaimの検証
  const idToken = data.id_token as string;
  const JWKS = jose.createRemoteJWKSet(
    new URL(process.env.OIDC_ISSUER_JWKS_ENDPOINT as string)
  );
  let payload: jose.JWTPayload;
  try {
    const result = await jose.jwtVerify(idToken, JWKS, {
      issuer: process.env.OIDC_ISSUER as string,
      audience: process.env.OIDC_CLIENT_ID as string,
    });
    payload = result.payload;
    console.log("payload", payload);
  } catch (error) {
    console.error("JWT verification failed:", error);
    authSession.destroy();
    await authSession.save();
    return NextResponse.redirect(
      new URL(`/?error=${OIDCError.invalid_id_token}`, request.url)
    );
  }

  // nonceの検証
  const sessionNonce = authSession.data?.nonce;
  if (!sessionNonce || sessionNonce !== payload.nonce) {
    // nonceが一致しない場合はリプレイ攻撃の可能性があるため、エラーを返す
    console.error("Replay attack detected: nonce mismatch");
    authSession.destroy();
    await authSession.save();
    return NextResponse.redirect(
      new URL(`/?error=${OIDCError.invalid_nonce}`, request.url)
    );
  }

  // DB上のユーザ情報と照合(登録済みならログイン、未登録なら登録処理を行う)
  const sub = payload.sub as string;
  const db = await getDB();
  let user = Object.values(db.users).find((user) => user.externalId === sub);
  if (!user) {
    // 未登録の場合は登録処理を行う。
    user = {
      id: crypto.randomUUID(),
      name: payload.name as string,
      picture: payload.picture as string,
      externalId: sub,
      loginCount: 0,
    };
    db.users[user.id] = user;
    await db.save();
    console.log("新規登録完了");
  } else {
    console.log("登録済みユーザ");
  }

  console.log(user);

  // ここで必要に応じてaccess_tokenで/userinfoエンドポイントを叩いて情報を取得することもできる
  // その場合はat_hashによるaccess_tokenの検証が必要
  // ただし、今回はid_tokenの情報だけで十分なので省略する

  // ログイン処理
  // ログイン回数をカウントアップ(UI用)
  db.users[user.id].loginCount++;
  await db.save();
  // ログインセッションにユーザ情報を保存
  const loginSession = await getLoginSession();
  loginSession.data = {
    id: user.id,
  };
  await loginSession.save();

  // 認可コードやPKCEの情報は不要なので、セッションを破棄する
  authSession.destroy();

  // トップページにリダイレクト
  return NextResponse.redirect(new URL("/", request.url));
}
