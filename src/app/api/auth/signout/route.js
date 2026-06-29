import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.redirect(new URL('/', request.url));
}

export async function POST(request) {
  return NextResponse.redirect(new URL('/', request.url));
}
