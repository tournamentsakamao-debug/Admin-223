/**
 * PLAYER DASHBOARD (NOT USED)
 * --------------------------------
 * This app is ADMIN-ONLY for now.
 * File exists to keep structure clean
 * and avoid future refactor issues.
 */

export default function UserDashboard() {
  return (
    <div style={styles.wrapper}>
      <h2>User Dashboard</h2>
      <p>This panel is disabled.</p>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#020617',
    color: '#94a3b8'
  }
};
