import { getSession } from "@/lib/server/session";
import { generateUrlSafeRandomString } from "@/lib/shared/base64";
import { NextResponse } from "next/server";
import pkceChallenge from "pkce-challenge";

// OIDCの認可プロセスを開始するURL
// nonceやstateを生成して、認可リクエストを行う
export async function GET() {
  // 攻撃対策
  // TODO: nonceの導入
  const state = generateUrlSafeRandomString(32);
  // PKCE
  const { code_verifier, code_challenge } = await pkceChallenge();

  const session = await getSession();
  session.auth = {
    state,
    code_verifier,
  };
  await session.save();

  // 認可リクエストのURLを生成
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OIDC_CLIENT_ID as string,
    redirect_uri: process.env.OIDC_CLIENT_REDIRECT_URI as string,
    scope: "openid profile",
    state,
    code_challenge,
    code_challenge_method: "S256",
  });
  const authURL = process.env.OIDC_ISSUER_AUTH_ENDPOINT as string;
  const authRequestURL = new URL(`${authURL}?${params.toString()}`);
  console.log("authRequestURL", authRequestURL);

  return NextResponse.redirect(authRequestURL);
}
