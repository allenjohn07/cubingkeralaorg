'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import cookie from 'cookie';
import { UserInfo } from '@/types/types';
import { Profile } from './profile';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';

const CubingKeralaNavbar = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const cookies = cookie.parse(document.cookie);
    const userInfoFromCookie = cookies.userInfo;

    if (userInfoFromCookie) {
      setUserInfo(JSON.parse(userInfoFromCookie));
    }
  }, []);

  async function handleLogout() {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      toast.success('Logged out successfully');
      setTimeout(() => {
        window.localStorage.clear();
        window.location.reload();
      }, 2000);
      router.replace('/')
    } else {
      console.error('Logout failed');
      toast.error('Logout failed. Please try again.');
    }
  }

  return (
    <header style={{ zIndex: '10000' }} className="bg-black text-stone-200 border-b-[1px] border-neutral-800 py-2 px-1 md:px-0 sticky top-0">
      <div className="container md:flex items-center justify-between h-20 md:h-18 py-0 pb-2 md:py-6 px-4 md:px-6">
        <Link href="/" className="flex items-center justify-start" prefetch={true}>
          <Image className='h-12 w-12 md:w-20 md:h-20' width={200} height={200} src="/logoblack.png" alt="Cubing Kerala" />
        </Link>
        <nav className="flex items-center justify-between gap-6">
          <Link href="/competitions" className="text-sm md:text-[15px] font-medium hover:text-green-400" prefetch={true}>
            Competitions
          </Link>
          <Link href="/members" className="text-sm md:text-[15px] font-medium hover:text-green-400" prefetch={true}>
            Members
          </Link>
          <Link href="/rankings" className="text-sm md:text-[15px] font-medium hover:text-green-400" prefetch={true}>
            Rankings
          </Link>
          {userInfo ? (
            <Profile profileInfo={userInfo} handleLogout={handleLogout} />
          ) : (
            <Link href="/login" className="text-sm md:text-[15px] font-medium hover:text-green-400 mr-1" prefetch={true}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default CubingKeralaNavbar;
