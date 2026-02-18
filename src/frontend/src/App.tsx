import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import AppShell from './components/layout/AppShell';
import LoginButton from './components/auth/LoginButton';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import AccessDeniedScreen from './components/auth/AccessDeniedScreen';
import HomeDashboard from './pages/HomeDashboard';
import CalendarPage from './pages/CalendarPage';
import AddEventPage from './pages/AddEventPage';
import EditEventPage from './pages/EditEventPage';
import EventDetailsPage from './pages/EventDetailsPage';
import PaymentsPage from './pages/PaymentsPage';
import ImportFromSheetPage from './pages/ImportFromSheetPage';
import AppBranding from './components/branding/AppBranding';

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  
  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AppBranding />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <AppBranding />
          <h1 className="text-2xl font-bold">Push Sports Event Manager</h1>
          <p className="text-muted-foreground">
            Manage and track all your sports events with full calendar visibility and reminder system.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  if (showProfileSetup) {
    return <ProfileSetupModal />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeDashboard,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarPage,
});

const addEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/add-event',
  component: AddEventPage,
});

const editEventRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/edit-event/$eventId',
  component: EditEventPage,
});

const eventDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/event/$eventId',
  component: EventDetailsPage,
});

const paymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payments',
  component: PaymentsPage,
});

const importRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/import',
  component: ImportFromSheetPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  calendarRoute,
  addEventRoute,
  editEventRoute,
  eventDetailsRoute,
  paymentsRoute,
  importRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
