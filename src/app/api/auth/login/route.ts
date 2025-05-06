import { getSession } from "@/lib/server/session";
import { generateUrlSafeRandomString } from "@/lib/shared/base64";
import { NextResponse } from "next/server";

// OIDCの認可プロセスを開始するURL
// nonceやstateを生成して、認可リクエストを行う
export async function GET() {
  // 攻撃対策
  // TODO: nonceの導入
  const state = generateUrlSafeRandomString(32);

  const session = await getSession();
  session.auth = {
    state,
  };
  await session.save();

  // TODO: PKCEを導入

  // 認可リクエストのURLを生成
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.OIDC_CLIENT_ID as string,
    redirect_uri: process.env.OIDC_CLIENT_REDIRECT_URI as string,
    scope: "openid profile",
    state,
  });
  const authURL = process.env.OIDC_ISSUER_AUTH_ENDPOINT as string;
  const authRequestURL = new URL(`${authURL}?${params.toString()}`);
  console.log("authRequestURL", authRequestURL);

  return NextResponse.redirect(authRequestURL);
}
