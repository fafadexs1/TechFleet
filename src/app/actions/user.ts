'use server';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      console.log('No session or user ID found in getCurrentUser');
      return null;
    }

    console.log(`Fetching technician data for UUID: ${session.user.id}`);

    const technician = await prisma.membros.findUnique({
      where: { uuid: session.user.id },
    });

    if (technician) {
      console.log(`Found technician: ${technician.display_name}`);
      return {
        ...technician,
        id: Number(technician.id)
      };
    }

    console.log('Technician not found for UUID:', session.user.id);
    return null;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}
