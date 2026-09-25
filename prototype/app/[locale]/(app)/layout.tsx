import type { ReactNode } from 'react';
import { getSession } from '@/lib/auth/session';
import { redirect } from '@/i18n/navigation';
import Navbar from './navbar';

/**
 * Shared layout for every route under the (app) group. Acts as the auth
 * gate: redirects to /login before rendering the navbar or any page.
 */
export default async function AppLayout({children, params}: {
    children: ReactNode;
    params: Promise<{locale: string}>;
}) {

     const {locale} = await params;

    const sessionUser = await getSession();
    if (!sessionUser) {
        redirect({href: "/login", locale});
    }

    return (
        <>
        <Navbar />
        { children }
        </>
  );
    
}