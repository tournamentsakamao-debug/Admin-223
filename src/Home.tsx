import { useState } from 'react';
import { supabase } from './supabase';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    // 🔐 HARD LOCK (as requested)
    if (
      username !== 'admin' ||
      password !== 'prounknown055@gmail.com'
    ) {
      alert('Invalid Admin Credentials');
      return;
    }

    setLoading(true);

    // 🔎 Fetch admin from SQL users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .eq('role', 'ADMIN')
      .single();

    setLoading(false);

    if (error || !data) {
      alert('Admin not found in database');
      return;
    }

    // ✅ Save admin session
    localStorage.setItem('admin_user', JSON.stringify(data));
    location.reload();
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.subtitle}>Tournament Control Panel</p>

        <input
          style={styles.input}
          placeholder="Admin Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          style={styles.button}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Login'}
        </button>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, #020617, #000)',
  },
  card: {
    width: 320,
    padding: 24,
    borderRadius: 14,
    background: '#020617',
    boxShadow: '0 0 40px rgba(0,0,0,0.7)',
    textAlign: 'center'
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700
  },
  subtitle: {
    marginBottom: 20,
    color: '#94a3b8',
    fontSize: 13
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    marginBottom: 12,
    borderRadius: 8,
    border: '1px solid #1e293b',
    background: '#020617',
    color: '#e5e7eb',
    outline: 'none'
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
    color: '#020617'
  }
};
