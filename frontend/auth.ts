import { cookies } from 'next/headers';
import { getSession } from '@/utils/auth';
import { createDefaultUser } from '@/utils/auth';

export async function auth() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    const defaultUser = await createDefaultUser();
    return { user: defaultUser };
  }

  const session = await getSession();
  
  if (!session) {
    return null;
  }

  return { 
    user: {
      id: session.userId,
      isDefaultUser: session.isDefaultUser
    } 
  };
}
