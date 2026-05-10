import AppRoutes from './routes';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
      <ToastContainer />
    </ErrorBoundary>
  );
}
