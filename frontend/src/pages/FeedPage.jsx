import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';
import PostCard from '../components/PostCard';

export default function FeedPage({ user }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [feedFilter, setFeedFilter] = useState('all');
  const intervalRef = useRef(null);

  const loadFeed = useCallback(async () => {
    try {
      const url = feedFilter === 'following' ? '/api/feed?filter=following' : '/api/feed';
      const data = await apiFetch(url);
      setPosts(data.posts || []);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Could not load feed.');
    }
  }, [feedFilter]);

  useEffect(() => {
    loadFeed();
    intervalRef.current = setInterval(loadFeed, 15000);
    return () => clearInterval(intervalRef.current);
  }, [loadFeed]);

  async function handlePost(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setPostError('');
    setIsPosting(true);

    try {
      const data = await apiFetch('/api/posts', {
        method: 'POST',
        body: { content: trimmed },
      });

      setPosts((prev) => [data.post, ...prev]);
      setContent('');
    } catch (error) {
      setPostError(error.message || 'Could not post.');
    } finally {
      setIsPosting(false);
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

  const charsLeft = 280 - content.length;

  return (
    <div className="feed-layout">
      <div className="feed-tabs">
        <button
          type="button"
          className={`feed-tab${feedFilter === 'all' ? ' feed-tab-active' : ''}`}
          onClick={() => setFeedFilter('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`feed-tab${feedFilter === 'following' ? ' feed-tab-active' : ''}`}
          onClick={() => setFeedFilter('following')}
        >
          Following
        </button>
      </div>

      <section className="card compose-card">
        <h2>What's happening?</h2>
        <form onSubmit={handlePost} className="compose-form">
          <textarea
            className="compose-textarea"
            placeholder="Share something..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={3}
          />
          <div className="compose-footer">
            <span className={`char-count ${charsLeft < 20 ? 'char-count-warn' : 'muted'}`}>
              {charsLeft}
            </span>
            <button
              type="submit"
              className="primary-button"
              disabled={isPosting || content.trim().length === 0}
            >
              {isPosting ? 'Posting...' : 'Chirp'}
            </button>
          </div>
          {postError && <p className="error-text">{postError}</p>}
        </form>
      </section>

      {loadError && <p className="error-text">{loadError}</p>}

      {posts.length === 0 && !loadError && feedFilter === 'all' && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
          No posts yet. Be the first to chirp!
        </p>
      )}

      {posts.length === 0 && !loadError && feedFilter === 'following' && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
          You aren't following anyone yet.{' '}
          <a href="/search">Find people to follow on the Search page.</a>
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
