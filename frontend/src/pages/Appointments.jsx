import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await api.get('/appointments');
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
      case 'confirmed': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
      case 'completed': return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' };
      case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
      default: return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: '28px', fontWeight: 700, color: '#fff' }}>Appointments</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Manage and view all clinic appointments.</p>
        </div>
        <button style={{
          background: 'linear-gradient(135deg, #0d9488, #0a7a70)',
          color: '#fff', border: 'none', borderRadius: '10px',
          padding: '10px 20px', fontSize: '14px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s'
        }} onClick={() => toast.success('Add Appointment modal coming soon!')}>
          + New Appointment
        </button>
      </div>

      <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid #1e2d3d', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
            <p>No appointments found in the database.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#0a0e17', borderBottom: '1px solid #1e2d3d' }}>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Service</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Doctor</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const statusStyle = getStatusColor(apt.status);
                  return (
                    <tr key={apt._id} style={{ borderBottom: '1px solid #1e2d3d', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px', color: '#fff', fontWeight: 500 }}>{apt.patientName}</td>
                      <td style={{ padding: '16px', color: '#e2e8f0' }}>{apt.service || 'N/A'}</td>
                      <td style={{ padding: '16px', color: '#e2e8f0' }}>{apt.doctor}</td>
                      <td style={{ padding: '16px', color: '#94a3b8' }}>{apt.date} {apt.time ? `@ ${apt.time}` : ''}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex', padding: '4px 10px', borderRadius: '6px',
                          fontSize: '12px', fontWeight: 600,
                          background: statusStyle.bg, color: statusStyle.color,
                          textTransform: 'capitalize'
                        }}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
