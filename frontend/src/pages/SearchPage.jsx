import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function avatarUrl(filename) {
  return `${API_BASE}/uploads/${filename}`;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setSearchError('');
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data.users || []);
        setSearched(true);
        setSearchError('');
      } catch (err) {
        setSearchError(err.message || 'Could not search.');
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="feed-layout">
      <section className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '0.6rem', color: '#374151' }}>Find People</h2>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%' }}
        />
      </section>

      {searchError && <p className="error-text">{searchError}</p>}

      {!query.trim() && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '1rem' }}>
          Start typing to search for users.
        </p>
      )}

      {searched && results.length === 0 && query.trim() && (
        <p className="muted" style={{ textAlign: 'center', marginTop: '1rem' }}>
          No users found for "{query}".
        </p>
      )}

      {results.map((u) => (
        <Link key={u.id} to={`/users/${encodeURIComponent(u.username)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="user-search-card">
            <div className="post-avatar" style={!u.avatar ? { background: u.avatar_color || '#0f5cc0' } : {}}>
              {u.avatar ? (
                <img src={avatarUrl(u.avatar)} alt={u.username} className="avatar-img avatar-img-sm" />
              ) : (
                u.username[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700 }}>@{u.username}</p>
              {u.bio && (
                <p className="muted" style={{ margin: '0.15rem 0 0', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.bio}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
