import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import SyncStatusBar from '../status/SyncStatusBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div 
      className="min-h-screen bg-background pb-20 relative"
      style={{
        backgroundImage: 'url(/assets/generated/sports-bg.dim_1080x1920.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      <div className="relative z-10">
        <SyncStatusBar />
        <main className="container max-w-2xl mx-auto px-4 py-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
