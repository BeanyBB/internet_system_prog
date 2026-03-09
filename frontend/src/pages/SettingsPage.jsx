import { useState } from 'react';
import { apiFetch } from '../api';

export default function SettingsPage({ setUser }) {
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function handleUsernameChange(e) {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    setUsernameSaving(true);
    try {
      const data = await apiFetch('/api/account/username', {
        method: 'PATCH',
        body: { newUsername, password: usernamePassword },
      });
      setUsernameSuccess('Username updated successfully.');
      setUser((prev) => ({ ...prev, username: data.username }));
      setNewUsername('');
      setUsernamePassword('');
    } catch (error) {
      setUsernameError(error.message || 'Could not update username.');
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await apiFetch('/api/account/password', {
        method: 'PATCH',
        body: { currentPassword, newPassword },
      });
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message || 'Could not update password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="feed-layout">
      <h2 style={{ marginBottom: '1rem' }}>Account Settings</h2>

      <section className="card settings-card">
        <h3 className="settings-card-title">Change Username</h3>
        <form className="form-grid" onSubmit={handleUsernameChange}>
          <label>
            New username
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
            />
          </label>
          <label>
            Current password
            <input
              type="password"
              value={usernamePassword}
              onChange={(e) => setUsernamePassword(e.target.value)}
              required
            />
          </label>
          {usernameError && <p className="error-text">{usernameError}</p>}
          {usernameSuccess && <p className="success-text">{usernameSuccess}</p>}
          <button type="submit" className="primary-button" disabled={usernameSaving}>
            {usernameSaving ? 'Saving…' : 'Update Username'}
          </button>
        </form>
      </section>

      <section className="card settings-card">
        <h3 className="settings-card-title">Change Password</h3>
        <form className="form-grid" onSubmit={handlePasswordChange}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {passwordError && <p className="error-text">{passwordError}</p>}
          {passwordSuccess && <p className="success-text">{passwordSuccess}</p>}
          <button type="submit" className="primary-button" disabled={passwordSaving}>
            {passwordSaving ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </section>
    </div>
  );
}
