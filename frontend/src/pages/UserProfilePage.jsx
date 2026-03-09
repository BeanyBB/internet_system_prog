import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import PostCard from '../components/PostCard';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function avatarUrl(filename) {
  return `${API_BASE}/uploads/${filename}`;
}

export default function UserProfilePage({ currentUser }) {
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError('');

    apiFetch(`/api/users/${encodeURIComponent(username)}`)
      .then((data) => {
        if (!cancelled) {
          setProfileUser(data.user);
          setPosts(data.posts || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Could not load profile.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [username]);

  async function handleFollow() {
    if (!profileUser || followLoading) return;
    setFollowLoading(true);
    try {
      const data = await apiFetch(`/api/users/${encodeURIComponent(profileUser.username)}/follow`, { method: 'POST' });
      setProfileUser((prev) => ({
        ...prev,
        is_followed_by_me: data.following ? 1 : 0,
        follower_count: data.follower_count,
      }));
    } catch (_) {
      // silently ignore
    } finally {
      setFollowLoading(false);
    }
  }

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
    } catch (_) {}
  }

  const isOwnProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  return (
    <div className="feed-layout">
      {isLoading && <p className="muted" style={{ textAlign: 'center' }}>Loading...</p>}
      {loadError && <p className="error-text">{loadError}</p>}

      {profileUser && (
        <>
          <section className="card profile-header-card">
            <div className="profile-avatar-large" style={!profileUser.avatar ? { background: profileUser.avatar_color || '#0f5cc0' } : {}}>
              {profileUser.avatar ? (
                <img src={avatarUrl(profileUser.avatar)} alt={profileUser.username} className="avatar-img avatar-img-lg" />
              ) : (
                profileUser.username[0].toUpperCase()
              )}
            </div>
            <div>
              <h2 className="profile-name">@{profileUser.username}</h2>
              {profileUser.bio && <p className="muted" style={{ margin: '0 0 0.25rem' }}>{profileUser.bio}</p>}
              <p className="muted">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
              <p className="muted" style={{ margin: '0.1rem 0' }}>
                <strong>{profileUser.follower_count ?? 0}</strong> followers &nbsp;·&nbsp;{' '}
                <strong>{profileUser.following_count ?? 0}</strong> following
              </p>
              {isOwnProfile ? (
                <Link to="/profile" className="nav-link" style={{ display: 'inline-block', marginTop: '0.5rem', color: '#0f5cc0', border: 'none', padding: 0 }}>
                  ← Edit your profile
                </Link>
              ) : (
                <button
                  type="button"
                  className={`follow-button${profileUser.is_followed_by_me ? ' follow-button-following' : ''}`}
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{ marginTop: '0.5rem' }}
                >
                  {followLoading ? '...' : profileUser.is_followed_by_me ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </section>

          {posts.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
              No posts yet.
            </p>
          )}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
              onLike={handleLike}
              readOnly
            />
          ))}
        </>
      )}
    </div>
  );
}
