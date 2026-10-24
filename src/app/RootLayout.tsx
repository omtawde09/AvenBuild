import { Outlet, ScrollRestoration } from 'react-router';
import { ToastRegion } from '@/components/ui/ToastRegion';

export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
      <ToastRegion />
    </>
  );
}
