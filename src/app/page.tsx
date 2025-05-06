import { getSession } from "@/lib/server/session";
import Image from "next/image";

export default async function Home() {
  // セッションからユーザ情報を取得
  const session = await getSession();
  const isLoggedIn = session.user !== undefined;
  const username = session.user?.name || "ゲスト";

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <p className="text-xl font-bold">{`ようこそ、${username}さん！`}</p>
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          {isLoggedIn ? (
            <a
              href="/api/auth/logout"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            >
              ログアウト
            </a>
          ) : (
            <a
              href="/api/auth/login"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            >
              Googleでログイン
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
