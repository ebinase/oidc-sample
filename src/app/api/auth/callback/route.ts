import * as jose from "jose";
import { getSession } from "@/lib/server/session";
import { NextResponse } from "next/server";

export enum OIDCError {
  invalid_state = "invalid_state",
  code_verifier_not_found = "code_verifier_not_found",
  token_fetch_failed = "token_fetch_failed",
  invalid_id_token = "invalid_id_token",
}

// OIDCのコールバックURL
// 認可コードの受取り、idトークンの取得・検証、ログイン処理を行う
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  console.log("searchParams", searchParams);
  const session = await getSession();
  console.log("session", session);

  // stateの検証
  const inputState = searchParams.get("state");
  const sessionState = session.auth?.state;

  if (!inputState || !sessionState || inputState !== sessionState) {
    // stateが一致しない場合はCSRF攻撃の可能性があるため、エラーを返す
    console.error("CSRF attack detected: state mismatch");
    session.auth = undefined;
    await session.save();
    return NextResponse.redirect(
      new URL(`/?error=${OIDCError.invalid_state}`, request.url)
    );
  }
  console.log("stateの確認完了！！");

  // PKCEの存在チェック
  const codeVerifier = session.auth?.code_verifier;
  if (!codeVerifier) {
    // code_verifierがsessionに存在しない場合はCSRF攻撃の可能性がある
    console.error("PKCE verification failed: code_verifier not found");
    session.auth = undefined;
    await session.save();
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
    session.auth = undefined;
    await session.save();
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
    session.auth = undefined;
    await session.save();
    return NextResponse.redirect(
      new URL(`/?error=${OIDCError.invalid_id_token}`, request.url)
    );
  }

  // TODO: DB上のユーザ情報と照合(登録済みならログイン、未登録なら登録処理を行う)

  // ユーザ情報の取得(本来はidトークンに含まれるため不要だが、学習のために取得)
  // TODO: at_hashによるaccess_tokenの検証
  const userInfoResponse = await fetch(
    process.env.OIDC_ISSUER_USERINFO_ENDPOINT as string,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    }
  );
  const userInfo = await userInfoResponse.json();
  console.log(userInfo);

  // ログイン処理
  session.user = {
    id: userInfo.sub,
    name: userInfo.name,
    picture: userInfo.picture,
  };
  session.auth = undefined; // 認可情報は不要なので削除
  await session.save();

  // トップページにリダイレクト
  return NextResponse.redirect(new URL("/", request.url));
}
