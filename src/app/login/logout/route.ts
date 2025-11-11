import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerActionClient } from '@/lib/supabase/clients';

export async function POST(_req: NextRequest) {
  const supabase = await createSupabaseServerActionClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', _req.url));
}
