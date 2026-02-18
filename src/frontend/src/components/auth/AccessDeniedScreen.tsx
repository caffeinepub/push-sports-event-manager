import LoginButton from './LoginButton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AccessDeniedScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this application.
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
