import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';
import PostCard from '../components/PostCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function avatarUrl(filename) {
  return `${API_BASE}/uploads/${filename}`;
}

export default function ProfilePage({ user, setUser }) {
  const [posts, setPosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef(null);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiFetch('/api/profile');
      setPosts(data.posts || []);
      setProfileUser(data.user);
      setBio(data.user?.bio || '');
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Could not load profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleLike(postId) {
    try {
      const data = await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            liked_by_me: data.liked ? 1 : 0,
            like_count: p.like_count + (data.liked ? 1 : -1),
          };
        })
      );
    } catch (_error) {
      // silently ignore
    }
  }

  async function handleDelete(postId) {
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (_error) {
      // silently ignore
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const data = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: { bio },
      });
      setProfileUser(data.user);
      setUser((prev) => ({ ...prev, bio: data.user.bio }));

      if (fileInputRef.current?.files?.length) {
        const formData = new FormData();
        formData.append('avatar', fileInputRef.current.files[0]);
        const response = await fetch(`${API_BASE}/api/profile/picture`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const picData = await response.json();
        if (!response.ok) throw new Error(picData.error || 'Upload failed.');
        setProfileUser(picData.user);
        setUser((prev) => ({ ...prev, avatar: picData.user.avatar }));
      }

      setEditing(false);
    } catch (error) {
      setSaveError(error.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  const displayUser = profileUser || user;

  return (
    <div className="feed-layout">
      <section className="card profile-header-card">
        <div className="profile-avatar-large" style={!displayUser?.avatar ? { background: displayUser?.avatar_color || '#0f5cc0' } : {}}>
          {displayUser?.avatar ? (
            <img src={avatarUrl(displayUser.avatar)} alt={displayUser.username} className="avatar-img avatar-img-lg" />
          ) : (
            displayUser?.username?.[0]?.toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 className="profile-name">@{displayUser?.username}</h2>
          {!editing && (
            <p className="muted" style={{ margin: '0 0 0.25rem' }}>
              {displayUser?.bio || <em>No bio yet.</em>}
            </p>
          )}
          <p className="muted">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
          <p className="muted" style={{ margin: '0.1rem 0' }}>
            <strong>{displayUser?.follower_count ?? 0}</strong> followers &nbsp;·&nbsp;{' '}
            <strong>{displayUser?.following_count ?? 0}</strong> following
          </p>
          {!editing && (
            <button type="button" className="primary-button" style={{ marginTop: '0.5rem' }} onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {editing && (
        <section className="card">
          <h3 style={{ marginBottom: '0.75rem' }}>Edit Profile</h3>
          <div className="form-grid">
            <label>
              Bio ({bio.length}/160)
              <textarea
                className="compose-textarea"
                maxLength={160}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </label>
            <label>
              Profile picture (JPEG or PNG, max 2 MB)
              <input type="file" accept="image/jpeg,image/png" ref={fileInputRef} />
            </label>
            {saveError && <p className="error-text">{saveError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="primary-button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="nav-button" style={{ color: '#374151', borderColor: '#b8c7da' }} onClick={() => { setEditing(false); setSaveError(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {loadError && <p className="error-text">{loadError}</p>}

      {isLoading && <p className="muted" style={{ textAlign: 'center' }}>Loading posts...</p>}

      {!isLoading && posts.length === 0 && !loadError && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
          You haven't posted anything yet.
        </p>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={user.id}
          onLike={handleLike}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
