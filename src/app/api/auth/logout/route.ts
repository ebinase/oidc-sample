import { NextResponse } from 'next/server';

// とりあえず、クッキーを削除する
export async function GET() {
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL as string));
  res.cookies.set('isLoggedIn', '0', {
    httpOnly: true,
  });
  res.cookies.set('username', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  return res;
}