import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaThLarge, FaUsers, FaCalendarCheck, FaCalendarAlt,
         FaFileMedical, FaPrescriptionBottleMedical, FaFlask,
         FaFileInvoiceDollar, FaBoxesStacked, FaUserTie,
         FaShieldHalved, FaChartBar, FaGear, FaLock } from 'react-icons/fa';

const navItems = [
  { section: 'Main' },
  { key:'dashboard', path:'/dashboard', icon:FaThLarge, label:'Dashboard' },
  { key:'patients', path:'/patients', icon:FaUsers, label:'Patients' },
  { key:'appointments', path:'/appointments', icon:FaCalendarCheck, label:'Appointments' },
  { key:'calendar', path:'/appointments', icon:FaCalendarAlt, label:'Calendar' },
  { section: 'Clinical' },
  { key:'records', path:'/patients', icon:FaFileMedical, label:'Medical Records' },
  { key:'prescriptions', path:'/patients', icon:FaPrescriptionBottleMedical, label:'Prescriptions' },
  { key:'lab', path:'/patients', icon:FaFlask, label:'Lab Results' },
  { section: 'Operations' },
  { key:'billing', path:'/appointments', icon:FaFileInvoiceDollar, label:'Billing' },
  { key:'inventory', path:'/appointments', icon:FaBoxesStacked, label:'Inventory' },
  { key:'staff', path:'/access-control', icon:FaUserTie, label:'Staff Management' },
  { key:'access-control', path:'/access-control', icon:FaShieldHalved, label:'Access Control' },
  { section: 'System' },
  { key:'reports', path:'/dashboard', icon:FaChartBar, label:'Reports' },
  { key:'settings', path:'/dashboard', icon:FaGear, label:'Settings' },
];

export default function Sidebar() {
  const { user, hasPermission, logout } = useAuth();

  return (
    <aside style={{
      width:'260px', minHeight:'100vh', background:'#0f1923',
      borderRight:'1px solid rgba(255,255,255,0.05)',
      display:'flex', flexDirection:'column'
    }}>
      <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily:"'Space Grotesk'", fontSize:'20px',
          fontWeight:700, color:'#fff' }}>MedBook AI</div>
      </div>

      <nav style={{ flex:1, padding:'16px 12px', overflowY:'auto' }}>
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} style={{
              fontSize:'10px', fontWeight:700, textTransform:'uppercase',
              letterSpacing:'1.5px', color:'#64748b', padding:'12px 12px 6px'
            }}>{item.section}</div>;
          }
          const allowed = hasPermission(item.key);
          if (!allowed) return null;
          const Icon = item.icon;
          return (
            <NavLink key={item.key} to={item.path} style={{
              display:'flex', alignItems:'center', gap:'12px',
              padding:'11px 14px', borderRadius:'10px',
              color:'rgba(255,255,255,0.55)', fontSize:'14px',
              fontWeight:500, textDecoration:'none', marginBottom:'2px'
            }} className={({ isActive }) => isActive ? 'nav-active' : ''}
            >
              <Icon /> {item.label}
            </NavLink>
          );
        })}

        {/* Show locked items for transparency */}
        {navItems.filter(i => i.key && !hasPermission(i.key)).map((item, i) => (
          <div key={`locked-${i}`} style={{
            display:'flex', alignItems:'center', gap:'12px',
            padding:'11px 14px', borderRadius:'10px',
            color:'rgba(255,255,255,0.15)', fontSize:'14px',
            cursor:'not-allowed', marginBottom:'2px'
          }}>
            <item.icon /> {item.label}
            <FaLock style={{ marginLeft:'auto', fontSize:'11px' }} />
          </div>
        ))}
      </nav>

      <div style={{ padding:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}
        onClick={logout} role="button" tabIndex={0}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px',
          padding:'10px 12px', borderRadius:'10px',
          background:'rgba(255,255,255,0.04)', cursor:'pointer' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700 }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ color:'#fff', fontSize:'14px', fontWeight:600 }}>{user?.name || 'User'}</div>
            <div style={{ color:'#64748b', fontSize:'11px', textTransform:'uppercase' }}>{user?.role || 'Role'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
