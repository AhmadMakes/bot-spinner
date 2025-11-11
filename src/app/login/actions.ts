'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerActionClient } from '@/lib/supabase/clients';

export type SignInState = {
  error?: string;
};

export async function signIn(prevState: SignInState, formData: FormData): Promise<SignInState> {
  const email = formData.get('email')?.toString().trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';
  const redirectTo = formData.get('redirectTo')?.toString() || '/dashboard/calls';

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createSupabaseServerActionClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Invalid credentials. Please double-check your email/password.' };
  }

  redirect(redirectTo);
}
