import { Link } from 'react-router-dom';

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

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function PostCard({ post, currentUserId, onLike, onDelete, readOnly }) {
  return (
    <article className="post-card">
      <div className="post-avatar" style={!post.avatar ? { background: post.avatar_color || '#0f5cc0' } : {}}>
        {post.avatar ? (
          <img src={avatarUrl(post.avatar)} alt={post.username} className="avatar-img avatar-img-sm" />
        ) : (
          post.username[0].toUpperCase()
        )}
      </div>

      <div className="post-body">
        <div className="post-header">
          <Link to={`/users/${post.username}`} className="post-username">
            @{post.username}
          </Link>
          <span className="muted post-time">{formatRelativeTime(post.created_at)}</span>
        </div>

        <p className="post-content">{post.content}</p>

        <div className="post-actions">
          <button
            type="button"
            className={`like-button ${post.liked_by_me ? 'liked' : ''}`}
            onClick={() => onLike && onLike(post.id)}
          >
            ♥ {post.like_count}
          </button>

          <Link to={`/posts/${post.id}`} className="comment-button">
            💬 {post.comment_count ?? 0}
          </Link>

          {!readOnly && post.user_id === currentUserId && (
            <button
              type="button"
              className="delete-button"
              onClick={() => onDelete(post.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
