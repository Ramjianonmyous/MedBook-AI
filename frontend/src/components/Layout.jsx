import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0e17' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', color: '#e2e8f0' }}>
        {children}
      </main>
    </div>
  );
}
