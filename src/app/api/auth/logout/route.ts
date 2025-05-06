import { getSession } from '@/lib/server/session';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // セッションを削除
  const session = await getSession();
  session.destroy();

  return NextResponse.redirect(new URL('/', request.url));
}