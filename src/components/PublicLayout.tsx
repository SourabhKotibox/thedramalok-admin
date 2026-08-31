import React from 'react';
import { PublicSidebar } from './PublicSidebar';
import { MobileNav } from './MobileNav';
import PublicHeader from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export interface PublicLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  user?: any;
  onSubscribeClick?: () => void;
  hideFooter?: boolean;
  hideSidebar?: boolean;
}

export default function PublicLayout({
  children,
  activeTab,
  setActiveTab,
  onSignIn,
  onSignOut,
  user,
  onSubscribeClick,
  hideFooter = false,
  hideSidebar = false,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-[#030306] text-white">
      {!hideSidebar && <PublicSidebar />}
      {!hideSidebar && <MobileNav />}

      <div className={`${!hideSidebar ? 'lg:ml-[80px]' : ''} min-h-screen flex flex-col pb-16 lg:pb-0`}>
        <PublicHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          user={user}
          onSubscribeClick={onSubscribeClick}
        />
        <main className="flex-1 w-full relative z-0">
          {children}
        </main>
        {!hideFooter && <PublicFooter />}
      </div>
    </div>
  );
}
