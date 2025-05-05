import { NextResponse } from 'next/server';

// OIDCの認可プロセスを開始するURL
// nonceやstateを生成して、認可リクエストを行う
export async function GET() {
  // TODO: nonceやstateはランダムな値を生成する
  const nonce = 'random-nonce'; 
  const state = 'random-state';
  // TODO: PKCEを導入
  // 認可リクエストのURLを生成
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.OIDC_CLIENT_ID as string,
    redirect_uri: process.env.OIDC_CLIENT_REDIRECT_URI as string,
    scope: 'openid profile',
    nonce,
    state,
  });

  const baseURL = process.env.OIDC_ISSUER_AUTH_ENDPOINT as string;

  return NextResponse.redirect(
    new URL(
      `${baseURL}?${params.toString()}`
    )
  );
}