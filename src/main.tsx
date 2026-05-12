import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { UserManagementMount } from './UserManagementMount';
import './index.css';
import { ErrorBoundary, installGlobalRuntimeLogging } from './components/ErrorBoundary';

installGlobalRuntimeLogging();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <UserManagementMount />
    </ErrorBoundary>
  </StrictMode>,
);
