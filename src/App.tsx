import { useEffect, useState } from 'react';
import Home from './Home';
import AdminDashboard from './AdminDashboard';
import { useSound } from './useSound';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 🔊 Global sound
  const { playTap } = useSound();

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={styles.center}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div onClick={playTap} style={styles.app}>
      {!user ? <Home /> : <AdminDashboard user={user} />}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #020617, #020617)',
    color: '#e5e7eb',
    fontFamily: 'system-ui, sans-serif'
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};
