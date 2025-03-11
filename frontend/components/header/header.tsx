'use client';

import { AuthStatus } from '../auth/auth-status';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="hover:opacity-80">
          <h1 className="text-xl font-semibold">基于大模型的中文文本校正</h1>
        </Link>
        <AuthStatus />
      </div>
    </header>
  );
}
