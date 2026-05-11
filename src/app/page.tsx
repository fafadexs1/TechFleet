import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  const session = await getSession();

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10" />
      <LoginForm />
    </div>
  );
}
