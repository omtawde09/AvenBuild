import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './styles/index.css';
import { createAppRouter } from './app/router';
import { RootErrorBoundary } from './app/RootErrorBoundary';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root is missing from index.html');

const router = createAppRouter();

createRoot(root).render(
  <StrictMode>
    <RootErrorBoundary>
      <RouterProvider router={router} />
    </RootErrorBoundary>
  </StrictMode>,
);
