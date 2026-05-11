'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt, decrypt, signToken } from '@/lib/auth';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' };
  }

  try {
    const user = await prisma.usuarios.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: 'E-mail ou senha inválidos.' };
    }

    const passwordMatch = await bcrypt.compare(password, user.senha_hash);

    if (!passwordMatch) {
      return { error: 'E-mail ou senha inválidos.' };
    }

    // Create the session
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    const session = await encrypt({ 
        user: {
            id: user.id,
            email: user.email,
            nome: user.nome,
            cargo: user.cargo
        }, 
        expires 
    });

    // Save the session in a cookie
    (await cookies()).set('session', session, { 
        expires, 
        httpOnly: true, 
        path: '/', 
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    return { error: 'Ocorreu um erro ao tentar fazer login.' };
  }
}



export async function logout() {
  (await cookies()).set('session', '', { expires: new Date(0), path: '/' });
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {
    const payload = await decrypt(token);
    if (!payload || !payload.userId) {
      return { error: 'Token inválido ou expirado.' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuarios.update({
      where: { id: payload.userId },
      data: { senha_hash: hashedPassword }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error resetting password with token:', error);
    return { error: 'Ocorreu um erro ao tentar redefinir a senha.' };
  }
}
