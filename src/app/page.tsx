import { getLoginSession } from "@/lib/server/session";
import { getDB } from "@/lib/server/database"; // データベース取得用関数
import Image from "next/image";
import { OIDCError } from "./api/auth/callback/route";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  // セッションからユーザーIDを取得
  const session = await getLoginSession();
  const userId = session.data?.id;

  // ログイン状態の判定
  const isLoggedIn = !!userId;

  // データベースからユーザー情報を取得
  let username = "ゲスト";
  let userIcon = ""; 
  let loginCount = 0;

  if (isLoggedIn) {
    let db;
    try {
      db = await getDB();
    } catch (error) {
      console.error("データベースの取得に失敗しました", error);
      return redirect("/api/auth/logout");
    }
    const user = db.users[userId];

    if (user) {
      username = user.name;
      userIcon = user.picture;
      loginCount = user.loginCount;
    } else {
      console.error("ユーザー情報がデータベースに存在しません");
      return redirect("/api/auth/logout");
    }
  }

  // クエリパラメータによるエラーメッセージの表示
  const { error } = await searchParams;
  let errorMessage = "";
  switch (error) {
    case undefined:
      errorMessage = "";
      break;
    case OIDCError.invalid_state:
      errorMessage = "stateの検証に失敗しました。CSRF攻撃の可能性があります。";
      break;
    case OIDCError.code_verifier_not_found:
      errorMessage =
        "PKCE用のcode_verifierが設定されていません。CSRF攻撃の可能性があります。";
      break;
    case OIDCError.token_fetch_failed:
      errorMessage =
        "トークンの取得に失敗しました。コードインジェクション攻撃の可能性があります。";
      break;
    case OIDCError.invalid_id_token:
      errorMessage =
        "idトークンの検証に失敗しました。改ざんされている可能性があります。";
      break;
    case OIDCError.invalid_nonce:
      errorMessage =
        "nonceの検証に失敗しました。リプレイ攻撃の可能性があります。";
      break;
    default:
      errorMessage = "不明なエラーが発生しました。";
      break;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <h1 className="text-4xl font-bold">OIDC Sample</h1>
        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
        {/* コンテンツ */}
        {isLoggedIn ? (
          <>
            <p className="text-lg">
              ようこそ、{username}さん
            </p>
            <div className="flex items-center gap-4 border border-solid border-gray-300 dark:border-gray-700 rounded-lg p-4">
              <Image
                src={userIcon}
                alt="User Icon"
                width={48}
                height={48}
                className="rounded-full"
                priority
              />
              <h2 className="text-2xl font-bold">{username}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ログイン回数: {loginCount}
              </p>
            </div>
            <p className="text-lg">
            </p>
            <a 
              href="/api/auth/logout"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            >
              ログアウト
            </a>
          </>
        ) : (
          <>
            <p className="text-lg">
              はじめまして、ゲストさん
            </p>
            <a
              href="/api/auth/login"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            >
              ログイン
            </a>
          </>
        )}
      </main>
    </div>
  );
}
