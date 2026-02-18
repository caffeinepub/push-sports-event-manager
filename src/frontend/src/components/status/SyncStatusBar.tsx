import { useConnectivity } from '../../hooks/useConnectivity';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';

export default function SyncStatusBar() {
  const { isOnline, pendingChanges } = useConnectivity();

  if (isOnline && pendingChanges === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
      <div className="container max-w-2xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
        {!isOnline && (
          <Badge variant="destructive" className="gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        )}
        {pendingChanges > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Wifi className="h-3 w-3" />
            {pendingChanges} pending sync
          </Badge>
        )}
      </div>
    </div>
  );
}
