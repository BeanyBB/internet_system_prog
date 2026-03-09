import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function avatarUrl(filename) {
  return `${API_BASE}/uploads/${filename}`;
}

function formatRelativeTime(isoString) {
  const date = new Date(isoString.replace(' ', 'T') + 'Z');
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function PostPage({ currentUser }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      apiFetch(`/api/posts/${id}`),
      apiFetch(`/api/posts/${id}/comments`),
    ])
      .then(([postData, commentData]) => {
        if (!cancelled) {
          setPost(postData.post);
          setComments(commentData.comments || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Could not load post.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  async function handleLikePost() {
    try {
      const data = await apiFetch(`/api/posts/${id}/like`, { method: 'POST' });
      setPost((prev) => ({
        ...prev,
        liked_by_me: data.liked ? 1 : 0,
        like_count: prev.like_count + (data.liked ? 1 : -1),
      }));
    } catch (_) {}
  }

  async function handleLikeComment(commentId) {
    try {
      const data = await apiFetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      setComments((prev) =>
        prev.map((c) =>
          c.id !== commentId ? c : {
            ...c,
            liked_by_me: data.liked ? 1 : 0,
            like_count: c.like_count + (data.liked ? 1 : -1),
          }
        )
      );
    } catch (_) {}
  }

  async function handleDeleteComment(commentId) {
    try {
      await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) => ({ ...prev, comment_count: (prev.comment_count ?? 1) - 1 }));
    } catch (_) {}
  }

  async function handleSubmitComment(e) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setIsCommenting(true);
    setCommentError('');
    try {
      const data = await apiFetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        body: { content: trimmed },
      });
      setComments((prev) => [...prev, data.comment]);
      setPost((prev) => ({ ...prev, comment_count: (prev.comment_count ?? 0) + 1 }));
      setCommentText('');
    } catch (err) {
      setCommentError(err.message || 'Could not post comment.');
    } finally {
      setIsCommenting(false);
    }
  }

  if (isLoading) return <p className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</p>;
  if (loadError) return <p className="error-text" style={{ textAlign: 'center', marginTop: '2rem' }}>{loadError}</p>;
  if (!post) return null;

  return (
    <div className="feed-layout">
      <Link to="/feed" className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'inline-block' }}>
        ← Back to feed
      </Link>

      {/* Original post */}
      <article className="card post-detail-card">
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="post-avatar" style={!post.avatar ? { background: post.avatar_color || '#0f5cc0' } : {}}>
            {post.avatar ? (
              <img src={avatarUrl(post.avatar)} alt={post.username} className="avatar-img avatar-img-sm" />
            ) : (
              post.username[0].toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="post-header">
              <Link to={`/users/${post.username}`} className="post-username">@{post.username}</Link>
              <span className="muted post-time">{formatRelativeTime(post.created_at)}</span>
            </div>
            <p className="post-content" style={{ fontSize: '1.05rem' }}>{post.content}</p>
            <div className="post-actions">
              <button
                type="button"
                className={`like-button ${post.liked_by_me ? 'liked' : ''}`}
                onClick={handleLikePost}
              >
                ♥ {post.like_count}
              </button>
              <span className="muted" style={{ fontSize: '0.85rem', padding: '0.25rem 0.4rem' }}>
                💬 {post.comment_count ?? comments.length}
              </span>
            </div>
          </div>
        </div>
      </article>

      {/* Compose comment */}
      <section className="card">
        <form onSubmit={handleSubmitComment} className="compose-form">
          <textarea
            className="compose-textarea"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={280}
            rows={2}
          />
          <div className="compose-footer">
            <span className={`char-count ${(280 - commentText.length) < 20 ? 'char-count-warn' : 'muted'}`}>
              {280 - commentText.length}
            </span>
            <button
              type="submit"
              className="primary-button"
              disabled={isCommenting || !commentText.trim()}
            >
              {isCommenting ? 'Posting...' : 'Reply'}
            </button>
          </div>
          {commentError && <p className="error-text">{commentError}</p>}
        </form>
      </section>

      {/* Comments */}
      {comments.length === 0 && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '1rem' }}>
          No comments yet. Be the first to reply!
        </p>
      )}

      {comments.map((comment) => (
        <article key={comment.id} className="comment-card">
          <div className="post-avatar" style={{ width: 34, height: 34, fontSize: '0.85rem', ...(!comment.avatar ? { background: comment.avatar_color || '#0f5cc0' } : {}) }}>
            {comment.avatar ? (
              <img src={avatarUrl(comment.avatar)} alt={comment.username} className="avatar-img" style={{ width: 34, height: 34 }} />
            ) : (
              comment.username[0].toUpperCase()
            )}
          </div>
          <div className="post-body">
            <div className="post-header">
              <Link to={`/users/${comment.username}`} className="post-username" style={{ fontSize: '0.88rem' }}>
                @{comment.username}
              </Link>
              <span className="muted post-time">{formatRelativeTime(comment.created_at)}</span>
            </div>
            <p className="post-content" style={{ margin: '0 0 0.4rem', fontSize: '0.95rem' }}>{comment.content}</p>
            <div className="post-actions">
              <button
                type="button"
                className={`like-button ${comment.liked_by_me ? 'liked' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.2rem 0.55rem' }}
                onClick={() => handleLikeComment(comment.id)}
              >
                ♥ {comment.like_count}
              </button>
              {comment.user_id === currentUser?.id && (
                <button
                  type="button"
                  className="delete-button"
                  style={{ fontSize: '0.8rem', padding: '0.2rem 0.55rem' }}
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
