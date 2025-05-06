import { getSession } from "@/lib/server/session";
import { NextResponse } from "next/server";

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
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }
  console.log("stateの確認完了！！");

  // 認可コードを取得
  const code = searchParams.get("code");

  // idトークンの取得
  const params = new URLSearchParams({
    client_id: process.env.OIDC_CLIENT_ID as string,
    client_secret: process.env.OIDC_CLIENT_SECRET as string,
    redirect_uri: process.env.OIDC_CLIENT_REDIRECT_URI as string,
    code: code as string,
    grant_type: "authorization_code",
  });
  const baseURL = process.env.OIDC_ISSUER_TOKEN_ENDPOINT as string;
  const tokenResponse = await fetch(baseURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await tokenResponse.json();
  console.log(data);

  // idトークンの検証
  // TODO: idトークンの署名検証、nonceの検証、audの検証
  // TODO: DB上のユーザ情報と照合(登録済みならログイン、未登録なら登録処理を行う)

  // ユーザ情報の取得
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
