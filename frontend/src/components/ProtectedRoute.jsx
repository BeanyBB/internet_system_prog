import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return <div className="card">Checking session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
