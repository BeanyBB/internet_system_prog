import bcrypt from 'bcrypt';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { all, dataDir, get, initDb, run } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace-this-with-a-long-secret';

const SQLiteStore = connectSqlite3(session);

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: dataDir,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ── Static uploads ─────────────────────────────────────────────────────────────

app.use('/uploads', express.static(path.join(dataDir, 'uploads')));

// ── Multer ─────────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(dataDir, 'uploads'),
    filename(req, _file, cb) {
      const ext = _file.mimetype === 'image/png' ? 'png' : 'jpg';
      cb(null, `${req.session.userId}-${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed.'));
    }
  },
});

// ── Auth helpers ───────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'You must be logged in to do that.' });
    return;
  }

  next();
}

const AVATAR_COLORS = [
  '#0f5cc0', '#7c3aed', '#db2777', '#059669',
  '#d97706', '#dc2626', '#0891b2', '#65a30d',
  '#9333ea', '#ea580c', '#0d9488', '#be123c',
];

function randomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

function validateCredentials(username, password) {
  if (!username || username.length < 3 || username.length > 20) {
    return 'Username must be 3 to 20 characters.';
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can use letters, numbers, and underscores only.';
  }

  if (!password || password.length < 6 || password.length > 72) {
    return 'Password must be 6 to 72 characters.';
  }

  return null;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/signup', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');

    const validationError = validateCredentials(username, password);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const existingUser = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      res.status(409).json({ error: 'That username is already taken.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const color = randomAvatarColor();
    const insertResult = await run(
      'INSERT INTO users (username, password_hash, avatar_color) VALUES (?, ?, ?)',
      [username, passwordHash, color]
    );

    req.session.userId = insertResult.id;
    req.session.username = username;

    res.status(201).json({
      message: 'Signup successful.',
      user: { id: insertResult.id, username, bio: '', avatar: null, avatar_color: color },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Could not create account right now.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const user = await get('SELECT id, username, password_hash, bio, avatar, avatar_color FROM users WHERE username = ?', [username]);
    if (!user) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: 'Login successful.',
      user: { id: user.id, username: user.username, bio: user.bio, avatar: user.avatar, avatar_color: user.avatar_color },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Could not log in right now.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Could not log out right now.' });
      return;
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

app.get('/api/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      res.json({ authenticated: false });
      return;
    }

    const user = await get(
      `SELECT u.id, u.username, u.bio, u.avatar, u.avatar_color,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
       FROM users u WHERE u.id = ?`,
      [req.session.userId]
    );
    if (!user) {
      req.session.destroy(() => {});
      res.json({ authenticated: false });
      return;
    }

    res.json({ authenticated: true, user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Could not check login status.' });
  }
});

// ── Feed ──────────────────────────────────────────────────────────────────────

app.get('/api/feed', requireAuth, async (req, res) => {
  try {
    const filter = req.query.filter;
    const isFollowing = filter === 'following';

    const params = isFollowing
      ? [req.session.userId, req.session.userId]
      : [req.session.userId];

    const followingClause = isFollowing
      ? 'AND p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)'
      : '';

    const posts = await all(
      `
      SELECT p.id, p.user_id, p.content, p.created_at,
             u.username, u.bio, u.avatar, u.avatar_color,
             COUNT(DISTINCT l.id) AS like_count,
             MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE 1=1 ${followingClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 100
      `,
      params
    );

    res.json({ posts });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Could not load feed.' });
  }
});

// ── Posts ─────────────────────────────────────────────────────────────────────

app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();

    if (!content) {
      res.status(400).json({ error: 'Post content cannot be empty.' });
      return;
    }

    if (content.length > 280) {
      res.status(400).json({ error: 'Post must be 280 characters or fewer.' });
      return;
    }

    const insertResult = await run(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [req.session.userId, content]
    );

    const newPost = await get(
      `
      SELECT p.id, p.user_id, p.content, p.created_at,
             u.username, u.bio, u.avatar, u.avatar_color,
             0 AS like_count,
             0 AS liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
      `,
      [insertResult.id]
    );

    res.status(201).json({ message: 'Post created.', post: newPost });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Could not create post.' });
  }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);

    const post = await get('SELECT id, user_id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    if (post.user_id !== req.session.userId) {
      res.status(403).json({ error: 'You can only delete your own posts.' });
      return;
    }

    await run('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Could not delete post.' });
  }
});

// ── Likes ─────────────────────────────────────────────────────────────────────

app.post('/api/posts/:id/like', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);

    const post = await get('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    const existing = await get(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
      [req.session.userId, postId]
    );

    if (existing) {
      await run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.session.userId, postId]);
      res.json({ liked: false });
    } else {
      await run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.session.userId, postId]);
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Could not update like.' });
  }
});

// ── Profile ───────────────────────────────────────────────────────────────────

app.get('/api/profile', requireAuth, async (req, res) => {
  try {
    const userRow = await get(
      `SELECT u.id, u.username, u.bio, u.avatar, u.avatar_color,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
       FROM users u WHERE u.id = ?`,
      [req.session.userId]
    );

    const posts = await all(
      `
      SELECT p.id, p.user_id, p.content, p.created_at,
             u.username, u.bio, u.avatar, u.avatar_color,
             COUNT(DISTINCT l.id) AS like_count,
             MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      `,
      [req.session.userId, req.session.userId]
    );

    res.json({ user: userRow, posts });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Could not load profile.' });
  }
});

app.patch('/api/profile', requireAuth, async (req, res) => {
  try {
    const bio = String(req.body.bio || '').trim();

    if (bio.length > 160) {
      res.status(400).json({ error: 'Bio must be 160 characters or fewer.' });
      return;
    }

    await run('UPDATE users SET bio = ? WHERE id = ?', [bio, req.session.userId]);
    const user = await get('SELECT id, username, bio, avatar, avatar_color FROM users WHERE id = ?', [req.session.userId]);
    res.json({ user });
  } catch (error) {
    console.error('Update bio error:', error);
    res.status(500).json({ error: 'Could not update bio.' });
  }
});

app.post('/api/profile/picture', requireAuth, (req, res) => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    try {
      const oldUser = await get('SELECT avatar FROM users WHERE id = ?', [req.session.userId]);
      if (oldUser && oldUser.avatar) {
        const oldPath = path.join(dataDir, 'uploads', oldUser.avatar);
        fs.unlink(oldPath, () => {});
      }

      await run('UPDATE users SET avatar = ? WHERE id = ?', [req.file.filename, req.session.userId]);
      const user = await get('SELECT id, username, bio, avatar, avatar_color FROM users WHERE id = ?', [req.session.userId]);
      res.json({ user });
    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ error: 'Could not update profile picture.' });
    }
  });
});

// ── User search ────────────────────────────────────────────────────────────────

app.get('/api/users/search', requireAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.status(400).json({ error: 'Search query cannot be empty.' });
      return;
    }

    const users = await all(
      'SELECT id, username, bio, avatar, avatar_color FROM users WHERE username LIKE ? AND id != ? LIMIT 20',
      [`%${q}%`, req.session.userId]
    );

    res.json({ users });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Could not search users.' });
  }
});

// ── Follow / unfollow ──────────────────────────────────────────────────────────

app.post('/api/users/:username/follow', requireAuth, async (req, res) => {
  try {
    const username = req.params.username;
    const targetUser = await get('SELECT id FROM users WHERE username = ?', [username]);

    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (targetUser.id === req.session.userId) {
      res.status(400).json({ error: 'You cannot follow yourself.' });
      return;
    }

    const existing = await get(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [req.session.userId, targetUser.id]
    );

    if (existing) {
      await run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [req.session.userId, targetUser.id]);
      const { follower_count } = await get(
        'SELECT COUNT(*) AS follower_count FROM follows WHERE following_id = ?',
        [targetUser.id]
      );
      res.json({ following: false, follower_count });
    } else {
      await run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [req.session.userId, targetUser.id]);
      const { follower_count } = await get(
        'SELECT COUNT(*) AS follower_count FROM follows WHERE following_id = ?',
        [targetUser.id]
      );
      res.json({ following: true, follower_count });
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Could not update follow.' });
  }
});

// ── Public user profiles ───────────────────────────────────────────────────────

app.get('/api/users/:username', requireAuth, async (req, res) => {
  try {
    const username = req.params.username;
    const userRow = await get(
      `SELECT u.id, u.username, u.bio, u.avatar, u.avatar_color,
              (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_followed_by_me
       FROM users u WHERE u.username = ?`,
      [req.session.userId, username]
    );

    if (!userRow) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const posts = await all(
      `
      SELECT p.id, p.user_id, p.content, p.created_at,
             u.username, u.bio, u.avatar, u.avatar_color,
             COUNT(DISTINCT l.id) AS like_count,
             MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me,
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN likes l ON l.post_id = p.id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
      `,
      [req.session.userId, userRow.id]
    );

    res.json({ user: userRow, posts });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Could not load user profile.' });
  }
});

// ── Comments ───────────────────────────────────────────────────────────────────

app.get('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await get(
      `SELECT p.id, p.user_id, p.content, p.created_at,
              u.username, u.bio, u.avatar,
              COUNT(DISTINCT l.id) AS like_count,
              MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN likes l ON l.post_id = p.id
       WHERE p.id = ?
       GROUP BY p.id`,
      [req.session.userId, postId]
    );

    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Could not load post.' });
  }
});

app.get('/api/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const comments = await all(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
              u.username, u.avatar, u.avatar_color,
              COUNT(DISTINCT cl.id) AS like_count,
              MAX(CASE WHEN cl.user_id = ? THEN 1 ELSE 0 END) AS liked_by_me
       FROM comments c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN comment_likes cl ON cl.comment_id = c.id
       WHERE c.post_id = ?
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [req.session.userId, postId]
    );

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Could not load comments.' });
  }
});

app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const content = String(req.body.content || '').trim();

    if (!content) {
      res.status(400).json({ error: 'Comment cannot be empty.' });
      return;
    }

    if (content.length > 280) {
      res.status(400).json({ error: 'Comment must be 280 characters or fewer.' });
      return;
    }

    const post = await get('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    const result = await run(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.session.userId, content]
    );

    const comment = await get(
      `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
              u.username, u.avatar, u.avatar_color,
              0 AS like_count,
              0 AS liked_by_me
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [result.id]
    );

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Could not post comment.' });
  }
});

app.delete('/api/comments/:id', requireAuth, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await get('SELECT id, user_id FROM comments WHERE id = ?', [commentId]);

    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    if (comment.user_id !== req.session.userId) {
      res.status(403).json({ error: 'You can only delete your own comments.' });
      return;
    }

    await run('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Could not delete comment.' });
  }
});

app.post('/api/comments/:id/like', requireAuth, async (req, res) => {
  try {
    const commentId = Number(req.params.id);
    const comment = await get('SELECT id FROM comments WHERE id = ?', [commentId]);

    if (!comment) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    const existing = await get(
      'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
      [req.session.userId, commentId]
    );

    if (existing) {
      await run('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?', [req.session.userId, commentId]);
      res.json({ liked: false });
    } else {
      await run('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [req.session.userId, commentId]);
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Comment like error:', error);
    res.status(500).json({ error: 'Could not update like.' });
  }
});

// ── Account settings ───────────────────────────────────────────────────────────

app.patch('/api/account/username', requireAuth, async (req, res) => {
  try {
    const newUsername = normalizeUsername(req.body.newUsername);
    const password = String(req.body.password || '');

    const usernameError = newUsername.length < 3 || newUsername.length > 20
      ? 'Username must be 3 to 20 characters.'
      : !/^[a-zA-Z0-9_]+$/.test(newUsername)
        ? 'Username can use letters, numbers, and underscores only.'
        : null;

    if (usernameError) {
      res.status(400).json({ error: usernameError });
      return;
    }

    const user = await get('SELECT id, password_hash FROM users WHERE id = ?', [req.session.userId]);
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Incorrect current password.' });
      return;
    }

    const existing = await get('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, req.session.userId]);
    if (existing) {
      res.status(409).json({ error: 'That username is already taken.' });
      return;
    }

    await run('UPDATE users SET username = ? WHERE id = ?', [newUsername, req.session.userId]);
    req.session.username = newUsername;
    res.json({ message: 'Username updated.', username: newUsername });
  } catch (error) {
    console.error('Change username error:', error);
    res.status(500).json({ error: 'Could not update username.' });
  }
});

app.patch('/api/account/password', requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');

    if (!newPassword || newPassword.length < 6 || newPassword.length > 72) {
      res.status(400).json({ error: 'New password must be 6 to 72 characters.' });
      return;
    }

    const user = await get('SELECT password_hash FROM users WHERE id = ?', [req.session.userId]);
    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Incorrect current password.' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.session.userId]);
    res.json({ message: 'Password updated.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Could not update password.' });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

async function startServer() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Allowed frontend origin: ${FRONTEND_ORIGIN}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
