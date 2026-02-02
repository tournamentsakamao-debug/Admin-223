import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function Messages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();

    // simple polling (safe & reliable)
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true });

    setMessages(data || []);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    setLoading(true);

    await supabase.from('messages').insert([
      {
        sender_id: '00000000-0000-0000-0000-000000000000',
        sender_name: 'Admin',
        receiver_id: 'ALL',
        text,
        timestamp: Date.now(),
        read: false
      }
    ]);

    setText('');
    setLoading(false);
    fetchMessages();
  }

  return (
    <div>
      <h3 style={{ marginBottom: 10 }}>Chat</h3>

      <div style={styles.box}>
        {messages.map(m => (
          <div key={m.id} style={styles.msg}>
            <strong>{m.sender_name}:</strong> {m.text}
          </div>
        ))}
      </div>

      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="Type message..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button
          style={styles.sendBtn}
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  box: {
    height: 200,
    overflowY: 'auto',
    background: '#020617',
    border: '1px solid #1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  msg: {
    marginBottom: 6,
    fontSize: 14
  },
  inputRow: {
    display: 'flex',
    gap: 8
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #1e293b',
    background: '#020617',
    color: '#e5e7eb'
  },
  sendBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    background: '#22c55e',
    color: '#020617'
  }
};
