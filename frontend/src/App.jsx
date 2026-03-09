import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { apiFetch } from './api';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SearchPage from './pages/SearchPage';
import PostPage from './pages/PostPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const data = await apiFetch('/api/me');
        if (!cancelled) {
          setUser(data.user || null);
        }
      } catch (_error) {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(username, password) {
    const data = await apiFetch('/api/login', {
      method: 'POST',
      body: { username, password },
    });

    setUser(data.user);
  }

  async function handleSignup(username, password) {
    const data = await apiFetch('/api/signup', {
      method: 'POST',
      body: { username, password },
    });

    setUser(data.user);
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }

  return (
    <div>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="page-container">
        <Routes>
          <Route
            path="/login"
            element={
              user ? <Navigate to="/feed" replace /> : <LoginPage onLogin={handleLogin} />
            }
          />
          <Route
            path="/signup"
            element={
              user ? <Navigate to="/feed" replace /> : <SignupPage onSignup={handleSignup} />
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute user={user} loading={authLoading}>
                <FeedPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user} loading={authLoading}>
                <ProfilePage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user} loading={authLoading}>
                <SettingsPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:username"
            element={
              <ProtectedRoute user={user} loading={authLoading}>
                <UserProfilePage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute user={user} loading={authLoading}>
                <SearchPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute user={user} loading={authLoading}>
                <PostPage currentUser={user} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={user ? '/feed' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}
