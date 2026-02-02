import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import Messages from './Messages';

interface Props {
  user: any;
}

export default function AdminDashboard({ user }: Props) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create tournament form state
  const [name, setName] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [prize, setPrize] = useState('');

  useEffect(() => {
    fetchTournaments();
  }, []);

  async function fetchTournaments() {
    setLoading(true);
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    setTournaments(data || []);
    setLoading(false);
  }

  async function createTournament() {
    if (!name || !entryFee || !prize) {
      alert('Fill all fields');
      return;
    }

    await supabase.from('tournaments').insert([
      {
        id: Date.now().toString(),
        name,
        entry_fee: Number(entryFee),
        prize_pool: Number(prize),
        date: new Date().toISOString().slice(0, 10),
        time: '6 PM',
        status: 'UPCOMING'
      }
    ]);

    setName('');
    setEntryFee('');
    setPrize('');
    fetchTournaments();
  }

  function logout() {
    localStorage.removeItem('admin_user');
    location.reload();
  }

  return (
    <div style={styles.wrapper}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Admin Panel</h2>
          <small>Welcome, {user.username}</small>
        </div>
        <button style={styles.logout} onClick={logout}>
          Logout
        </button>
      </header>

      {/* CREATE TOURNAMENT */}
      <section style={styles.card}>
        <h3>Create Tournament</h3>

        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Tournament Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Entry Fee"
            type="number"
            value={entryFee}
            onChange={e => setEntryFee(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Prize Pool"
            type="number"
            value={prize}
            onChange={e => setPrize(e.target.value)}
          />
          <button style={styles.primaryBtn} onClick={createTournament}>
            Create
          </button>
        </div>
      </section>

      {/* TOURNAMENT LIST */}
      <section style={styles.card}>
        <h3>All Tournaments</h3>

        {loading && <p>Loading...</p>}

        {!loading && tournaments.length === 0 && (
          <p>No tournaments created</p>
        )}

        {tournaments.map(t => (
          <div key={t.id} style={styles.tournament}>
            <div>
              <strong>{t.name}</strong>
              <div style={styles.meta}>
                Entry ₹{t.entry_fee} • Prize ₹{t.prize_pool}
              </div>
            </div>
            <span style={styles.status}>{t.status}</span>
          </div>
        ))}
      </section>

      {/* CHAT */}
      <section style={styles.card}>
        <Messages />
      </section>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    minHeight: '100vh',
    padding: 20,
    background: '#020617',
    color: '#e5e7eb'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  logout: {
    background: '#ef4444',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer'
  },
  card: {
    background: '#020617',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  row: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  input: {
    flex: 1,
    minWidth: 140,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #1e293b',
    background: '#020617',
    color: '#e5e7eb'
  },
  primaryBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    background: 'linear-gradient(135deg,#22c55e,#16a34a)',
    color: '#020617'
  },
  tournament: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #1e293b'
  },
  meta: {
    fontSize: 12,
    color: '#94a3b8'
  },
  status: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 20,
    background: '#1e293b'
  }
};
