import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// Mock Data
const avatarColors = [
  'linear-gradient(135deg,#0d9488,#14b8a6)',
  'linear-gradient(135deg,#f97316,#fb923c)',
  'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  'linear-gradient(135deg,#ef4444,#f87171)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
  'linear-gradient(135deg,#6366f1,#818cf8)',
];

const initialPatients = [
  { id:1, firstName:'Sample', lastName:'Patient', phone:'+1 (555) 234-5678', email:'sample@medbook.ai', dob:'1990-03-15', status:'active', since:'May 2026', address:'456 Oak Street, San Francisco, CA', notes:'Regular checkup patient. No known allergies.' },
  { id:2, firstName:'Sarah', lastName:'Johnson', phone:'+1 (555) 345-6789', email:'sarah.j@email.com', dob:'1985-07-22', status:'active', since:'May 2026', address:'789 Pine Avenue, Oakland, CA', notes:'Diagnosed with Type 2 Diabetes. Monthly follow-up required.' },
  { id:3, firstName:'Michael', lastName:'Chen', phone:'+1 (555) 456-7890', email:'m.chen@email.com', dob:'1978-11-08', status:'pending', since:'May 2026', address:'321 Elm Drive, San Jose, CA', notes:'Referred by Dr. Williams for cardiology consultation.' },
  { id:4, firstName:'Emily', lastName:'Rodriguez', phone:'+1 (555) 567-8901', email:'emily.r@email.com', dob:'1995-01-30', status:'active', since:'May 2026', address:'654 Maple Lane, Daly City, CA', notes:'Annual physical exam. All vitals normal.' },
  { id:5, firstName:'James', lastName:'Wilson', phone:'+1 (555) 678-9012', email:'j.wilson@email.com', dob:'1982-09-12', status:'inactive', since:'May 2026', address:'987 Cedar Court, Berkeley, CA', notes:'Last visit 6 months ago. Follow-up pending.' },
  { id:6, firstName:'Lisa', lastName:'Park', phone:'+1 (555) 789-0123', email:'lisa.park@email.com', dob:'1992-05-18', status:'active', since:'May 2026', address:'147 Birch Road, Fremont, CA', notes:'Prenatal care. Due date: August 2026.' },
  { id:7, firstName:'David', lastName:'Thompson', phone:'+1 (555) 890-1234', email:'d.thompson@email.com', dob:'1988-12-03', status:'active', since:'May 2026', address:'258 Walnut Street, Palo Alto, CA', notes:'Post-surgery recovery. Orthopedic follow-up scheduled.' },
];

const roles = {
  admin: { label:'Administrator', color:'#f97316', icon:'fa-crown', name:'Admin User', email:'admin@medbook.ai' },
  doctor: { label:'Doctor', color:'#0d9488', icon:'fa-stethoscope', name:'Dr. Sarah Mitchell', email:'doctor@medbook.ai' },
  nurse: { label:'Nurse', color:'#8b5cf6', icon:'fa-heart-pulse', name:'Nurse Amy Collins', email:'nurse@medbook.ai' },
  receptionist: { label:'Receptionist', color:'#3b82f6', icon:'fa-headset', name:'Tom Bradley', email:'recep@medbook.ai' },
};

const permissions = {
  dashboard:      { admin:true, doctor:true, nurse:true, receptionist:true },
  patients:       { admin:true, doctor:true, nurse:true, receptionist:true },
  appointments:   { admin:true, doctor:true, nurse:true, receptionist:true },
  calendar:       { admin:true, doctor:true, nurse:true, receptionist:true },
  'ai-logs':      { admin:true, doctor:true, nurse:true, receptionist:true },
  notifications:  { admin:true, doctor:true, nurse:true, receptionist:true },
  issues:         { admin:true, doctor:true, nurse:true, receptionist:true },
  records:        { admin:true, doctor:true, nurse:true, receptionist:false },
  prescriptions:  { admin:true, doctor:true, nurse:false, receptionist:false },
  lab:            { admin:true, doctor:true, nurse:true, receptionist:false },
  billing:        { admin:true, doctor:false, nurse:false, receptionist:true },
  inventory:      { admin:true, doctor:false, nurse:true, receptionist:false },
  staff:          { admin:true, doctor:false, nurse:false, receptionist:false },
  access:         { admin:true, doctor:false, nurse:false, receptionist:false },
  reports:        { admin:true, doctor:true, nurse:false, receptionist:false },
  settings:       { admin:true, doctor:true, nurse:true, receptionist:true },
};

const writePermissions = {
  admin: ['patients','appointments','records','prescriptions','lab','billing','inventory','staff','access','settings'],
  doctor: ['patients','appointments','records','prescriptions','lab','settings'],
  nurse: ['patients','records','lab','inventory','settings'],
  receptionist: ['patients','appointments','billing','settings'],
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentRole = user?.role || 'admin';
  const roleData = roles[currentRole] || roles.admin;

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [patients, setPatients] = useState(initialPatients);
  const [appointments, setAppointments] = useState([]);
  const [nextId, setNextId] = useState(8);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('all');

  // AI Assistant State
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI assistant. How can I help you manage the clinic today?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState([
    { id: 1, action: 'Auto-sync', details: 'Added patient John Doe based on active appointment.', time: '10 min ago' },
    { id: 2, action: 'Status Update', details: 'Marked appointment for Sarah Johnson as Completed.', time: '1 hr ago' }
  ]);
  
  // Dropdown States
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [issuesDropdownOpen, setIssuesDropdownOpen] = useState(false);
  
  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'patientModal', 'viewPatientModal'
  const [viewingPatient, setViewingPatient] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null); // ID of patient
  
  // Form State for Add/Edit Patient
  const [patientForm, setPatientForm] = useState({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dob: '',
    status: 'active',
    address: '',
    notes: ''
  });

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 4, 1)); // May 2026

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
    }, 3200);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientsRes = await api.get('/patients');
        if (patientsRes.data.patients) {
          setPatients(patientsRes.data.patients);
        }
        
        const apptsRes = await api.get('/appointments');
        if (apptsRes.data.appointments) {
          setAppointments(apptsRes.data.appointments);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to sync with database. Using offline data.', 'warning');
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    showToast('You have been logged out.', 'warning');
  };

  const navigateTo = (page) => {
    if (!permissions[page]?.[currentRole]) {
      showToast('You do not have permission to access this section.', 'error');
      return;
    }
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  // Patient CRUD
  const openAddPatientModal = () => {
    setPatientForm({
      id: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dob: '',
      status: 'active',
      address: '',
      notes: ''
    });
    setActiveModal('patientModal');
  };

  const editPatient = (p) => {
    setPatientForm({
      id: p._id || p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      email: p.email,
      dob: p.dob || p.dateOfBirth, // Support both
      status: p.status,
      address: p.address,
      notes: p.notes || p.medicalNotes // Support both
    });
    setActiveModal('patientModal');
  };

  const savePatient = async () => {
    const { firstName, lastName, phone, email, dob, status, address, notes, id } = patientForm;

    if (!firstName || !lastName) {
      showToast('First name and last name are required.', 'error');
      return;
    }
    if (!phone) {
      showToast('Phone number is required.', 'error');
      return;
    }

    const patientData = {
      firstName,
      lastName,
      phone,
      email: email || 'N/A',
      dateOfBirth: dob || '2000-01-01',
      status,
      address: address || 'N/A',
      medicalNotes: notes || '',
    };

    try {
      if (id) {
        const res = await api.put(`/patients/${id}`, patientData);
        setPatients(patients.map(p => (p._id || p.id) === id ? res.data : p));
        showToast(`Patient ${firstName} ${lastName} updated successfully.`, 'success');
      } else {
        const res = await api.post('/patients', patientData);
        setPatients([...patients, res.data]);
        showToast(`Patient ${firstName} ${lastName} added successfully.`, 'success');
      }
      setActiveModal(null);
    } catch (error) {
      console.error('Error saving patient:', error);
      showToast('Failed to save patient to database.', 'error');
    }
  };

  const deletePatient = (id) => {
    setConfirmingDelete(id);
  };

  const confirmDelete = async (id) => {
    try {
      await api.delete(`/patients/${id}`);
      const p = patients.find(x => (x._id || x.id) === id);
      setPatients(patients.filter(x => (x._id || x.id) !== id));
      showToast(`Patient ${p.firstName} ${p.lastName} has been removed.`, 'error');
    } catch (error) {
      console.error('Error deleting patient:', error);
      showToast('Failed to delete patient from database.', 'error');
    }
    setConfirmingDelete(null);
  };

  const cancelDelete = () => {
    setConfirmingDelete(null);
  };

  const viewPatient = (p) => {
    setViewingPatient(p);
    setActiveModal('viewPatientModal');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    
    const userMsg = aiInput;
    setAiMessages([...aiMessages, { role: 'user', text: userMsg }]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await api.post('/ai/chat', { prompt: userMsg });
      const aiReply = res.data.response;
      
      setAiMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
      
      // Handle actions suggested by AI
      if (aiReply.includes('ACTION: MARK_APPOINTMENT_DONE')) {
        showToast('AI suggested marking appointment as done.', 'success');
        setAiLogs(prev => [
          { id: Date.now(), action: 'Status Update', details: 'Marked appointment as Completed based on user request.', time: 'Just now' },
          ...prev
        ]);
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Particles
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const colors = ['var(--primary)', 'var(--accent)', '#8b5cf6', '#0ea5e9'];
    const p = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 120 + 40,
      left: Math.random() * 100,
      color: colors[i % colors.length],
      duration: Math.random() * 20 + 15,
      delay: Math.random() * -20
    }));
    setParticles(p);
  }, []);

  // Combined Patients (including those with active appointments)
  const combinedPatients = [
    ...patients,
    ...appointments
      .filter(apt => apt.status?.toLowerCase() !== 'completed' && apt.status?.toLowerCase() !== 'done')
      .map(apt => {
        const exists = patients.some(p => (p.firstName + ' ' + p.lastName).toLowerCase() === apt.patientName.toLowerCase());
        if (!exists) {
          return {
            _id: apt._id,
            firstName: apt.patientName.split(' ')[0] || 'Unknown',
            lastName: apt.patientName.split(' ')[1] || 'Patient',
            phone: apt.phone || 'N/A',
            email: apt.email || 'N/A',
            status: 'pending',
            since: 'Appointment',
            isTemp: true
          };
        }
        return null;
      })
      .filter(Boolean)
  ];

  // Filtered Patients
  const filteredPatients = combinedPatients.filter(p => {
    const q = patientSearch.toLowerCase();
    const matchesSearch = (p.firstName + ' ' + p.lastName).toLowerCase().includes(q) ||
                          p.phone.includes(q) || p.email.toLowerCase().includes(q);
    const matchesStatus = patientStatusFilter === 'all' || p.status === patientStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calendar Helpers
  const changeMonth = (dir) => {
    if (dir === 0) {
      setCalendarDate(new Date(2026, 4, 1));
    } else {
      const d = new Date(calendarDate);
      d.setMonth(d.getMonth() + dir);
      setCalendarDate(d);
    }
  };

  const renderCalendarGrid = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    // Derive event days from appointments (Safe parsing)
    const eventDays = appointments
      .filter(apt => {
        if (!apt.date) return false;
        const parts = apt.date.split('-');
        return parts.length === 3 && parseInt(parts[0],10) === year && (parseInt(parts[1],10)-1) === month;
      })
      .map(apt => parseInt(apt.date.split('-')[2], 10));

    // Derive priority days (Safe parsing)
    const priorityDays = appointments
      .filter(apt => {
        if (!apt.date) return false;
        const parts = apt.date.split('-');
        const isEmergency = apt.service?.toLowerCase().includes('emergency') || apt.status?.toLowerCase() === 'pending';
        return parts.length === 3 && parseInt(parts[0],10) === year && (parseInt(parts[1],10)-1) === month && isEmergency;
      })
      .map(apt => parseInt(apt.date.split('-')[2], 10));

    const cells = [];

    // Header
    dayNames.forEach(d => {
      cells.push(<div key={`h-${d}`} className="calendar-header-cell">{d}</div>);
    });

    // Prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(<div key={`p-${i}`} className="calendar-cell other-month">{daysInPrevMonth - i}</div>);
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const hasEvent = eventDays.includes(d);
      const isPriority = priorityDays.includes(d);
      
      // Find appointments for this day (Safe parsing)
      const dayAppointments = appointments.filter(apt => {
        if (!apt.date) return false;
        const parts = apt.date.split('-');
        return parts.length === 3 && parseInt(parts[0],10) === year && (parseInt(parts[1],10)-1) === month && parseInt(parts[2],10) === d;
      });

      const tooltip = dayAppointments.length > 0 
        ? dayAppointments.map(apt => {
            const isEmergency = apt.service?.toLowerCase().includes('emergency') || apt.status?.toLowerCase() === 'pending';
            return `${apt.patientName} (${isEmergency ? 'High Priority' : 'Normal'})`;
          }).join('\n')
        : '';

      cells.push(
        <div 
          key={`d-${d}`} 
          className={`calendar-cell${isToday ? ' today' : ''}${isPriority ? ' priority' : hasEvent ? ' has-event' : ''}`}
          style={{
            background: isPriority ? 'rgba(239, 68, 68, 0.15)' : hasEvent ? 'rgba(13, 148, 136, 0.1)' : '',
            border: isPriority ? '1px solid var(--danger)' : hasEvent ? '1px solid var(--primary)' : '1px solid var(--border)',
            cursor: dayAppointments.length > 0 ? 'pointer' : 'default'
          }}
          title={tooltip}
          onClick={() => {
            if (dayAppointments.length > 0) {
              showToast(`Appointments: ${dayAppointments.map(a => a.patientName).join(', ')}`, 'success');
            } else {
              showToast(`No events on ${monthNames[month]} ${d}`, 'warning');
            }
          }}
        >
          {d}
        </div>
      );
    }

    // Next month
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      cells.push(<div key={`n-${i}`} className="calendar-cell other-month">{i}</div>);
    }

    return cells;
  };

  const recentActivities = [
    ...patients.map(p => ({
      id: p._id || p.id,
      text: `New patient ${p.firstName} ${p.lastName} registered`,
      type: 'Registration',
      time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString() : p.since || 'Just now',
      status: 'completed',
      date: p.createdAt || new Date()
    })),
    ...appointments.map(a => ({
      id: a._id,
      text: `Appointment booked for ${a.patientName}`,
      type: 'Appointment',
      time: a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : 'Just now',
      status: a.status?.toLowerCase() || 'pending',
      date: a.createdAt || new Date()
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <>
      {/* Floating Particles Background */}
      <div className="particles-bg" id="particlesBg">
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            width: `${p.size}px`, height: `${p.size}px`,
            left: `${p.left}%`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`
          }} />
        ))}
      </div>

      {/* Toast Container */}
      <div className="toast-container" id="toastContainer">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <i className={`fas ${t.type === 'success' ? 'fa-check-circle' : t.type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}`}></i> {t.message}
          </div>
        ))}
      </div>

      <div className="app-layout" id="appLayout">

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
          <div className="sidebar-brand">
            <div className="logo-icon">M</div>
            <div>
              <span>MedBook AI</span><br />
              <small>Clinic Management</small>
            </div>
          </div>

          <nav className="sidebar-nav" id="sidebarNav">
            <div className="nav-section-title">Main</div>
            <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
              <i className="fas fa-th-large"></i> Dashboard
            </div>
            <div className={`nav-item ${currentPage === 'patients' ? 'active' : ''}`} onClick={() => navigateTo('patients')}>
              <i className="fas fa-users"></i> Patients
              <span className="badge" id="patientBadge">{combinedPatients.length}</span>
            </div>
            <div className={`nav-item ${currentPage === 'appointments' ? 'active' : ''}`} onClick={() => navigateTo('appointments')}>
              <i className="fas fa-calendar-check"></i> Appointments
              <span className="badge">{appointments.length}</span>
            </div>
            <div className={`nav-item ${currentPage === 'calendar' ? 'active' : ''}`} onClick={() => navigateTo('calendar')}>
              <i className="fas fa-calendar-alt"></i> Calendar
            </div>
            <div className={`nav-item ${currentPage === 'ai-logs' ? 'active' : ''}`} onClick={() => navigateTo('ai-logs')}>
              <i className="fas fa-robot"></i> AI Logs
            </div>

            <div className="nav-section-title">Clinical</div>
            <div className={`nav-item ${currentPage === 'records' ? 'active' : ''} ${!permissions.records[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('records')}>
              <i className="fas fa-file-medical"></i> Medical Records
              {!permissions.records[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>
            <div className={`nav-item ${currentPage === 'prescriptions' ? 'active' : ''} ${!permissions.prescriptions[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('prescriptions')}>
              <i className="fas fa-prescription-bottle-medical"></i> Prescriptions
              {!permissions.prescriptions[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>
            <div className={`nav-item ${currentPage === 'lab' ? 'active' : ''} ${!permissions.lab[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('lab')}>
              <i className="fas fa-flask"></i> Lab Results
              {!permissions.lab[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>

            <div className="nav-section-title">Operations</div>
            <div className={`nav-item ${currentPage === 'billing' ? 'active' : ''} ${!permissions.billing[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('billing')}>
              <i className="fas fa-file-invoice-dollar"></i> Billing
              {!permissions.billing[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>
            <div className={`nav-item ${currentPage === 'inventory' ? 'active' : ''} ${!permissions.inventory[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('inventory')}>
              <i className="fas fa-boxes-stacked"></i> Inventory
              {!permissions.inventory[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>
            <div className={`nav-item ${currentPage === 'staff' ? 'active' : ''} ${!permissions.staff[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('staff')}>
              <i className="fas fa-user-tie"></i> Staff Management
              {!permissions.staff[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>
            <div className={`nav-item ${currentPage === 'access' ? 'active' : ''} ${!permissions.access[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('access')}>
              <i className="fas fa-shield-halved"></i> Access Control
              {!permissions.access[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>

            <div className="nav-section-title">System</div>
            <div className={`nav-item ${currentPage === 'reports' ? 'active' : ''} ${!permissions.reports[currentRole] ? 'disabled' : ''}`} onClick={() => navigateTo('reports')}>
              <i className="fas fa-chart-bar"></i> Reports
              {!permissions.reports[currentRole] && <i className="fas fa-lock lock-icon"></i>}
            </div>
            <div className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => navigateTo('settings')}>
              <i className="fas fa-gear"></i> Settings
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="user-card" onClick={handleLogout}>
              <div className="user-avatar" style={{ background: roleData.color || 'var(--primary)' }}>
                {user?.name?.[0] || roleData.name.charAt(0)}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name || roleData.name}</div>
                <div className="user-role">{roleData.label}</div>
              </div>
              <i className="fas fa-right-from-bracket" style={{ color: 'var(--text-muted)', fontSize: '13px' }}></i>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="main-content">
          {/* Top Bar */}
          <header className="topbar">
            <button className="topbar-btn" id="menuToggle" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="topbar-search">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search patients, appointments, records..." />
            </div>
            <div className="topbar-actions">
              <span className={`role-badge ${currentRole}`}>
                <i className={`fas ${roleData.icon}`}></i> {roleData.label}
              </span>
              {/* Notifications Dropdown */}
              <div style={{ position: 'relative' }}>
                <button className="topbar-btn" aria-label="Notifications" onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}>
                  <i className="fas fa-bell"></i>
                  <span className="notif-dot"></span>
                </button>
                {notifDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', width: '280px', zIndex: 100, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', marginTop: '8px', padding: '8px' }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '14px' }}>Notifications</div>
                    <div style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>New appointment booked by Sarah.</div>
                    <div style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Lab results ready for Michael.</div>
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { navigateTo('notifications'); setNotifDropdownOpen(false); }}>Show All</div>
                  </div>
                )}
              </div>

              {/* Issues Dropdown */}
              <div style={{ position: 'relative' }}>
                <button className="topbar-btn" aria-label="Issues" onClick={() => setIssuesDropdownOpen(!issuesDropdownOpen)}>
                  <i className="fas fa-ticket"></i>
                </button>
                {issuesDropdownOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', width: '280px', zIndex: 100, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', marginTop: '8px', padding: '8px' }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '14px' }}>Support Issues</div>
                    <div style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Login issue reported by Nurse Amy.</div>
                    <div style={{ padding: '12px', fontSize: '13px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Printer not working at reception.</div>
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { navigateTo('issues'); setIssuesDropdownOpen(false); }}>Show All</div>
                  </div>
                )}
              </div>
              <button className="topbar-btn" onClick={handleLogout} aria-label="Logout">
                <i className="fas fa-right-from-bracket"></i>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="page-content" id="pageContent">

            {/* Dashboard Page */}
            {currentPage === 'dashboard' && (
              <section className="page-section active" id="page-dashboard">
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: 900 }}>Welcome back, {user?.name?.split(' ')[0] || roleData.name.split(' ')[0]}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Here's what's happening at your clinic today.</p>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--primary)' }}><i className="fas fa-users"></i></div>
                    <div className="stat-info">
                      <h3>{patients.length}</h3>
                      <p>Total Patients</p>
                      <span className="trend up"><i className="fas fa-arrow-up"></i> 12%</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--accent)' }}><i className="fas fa-calendar-check"></i></div>
                    <div className="stat-info">
                      <h3>3</h3>
                      <p>Today's Appointments</p>
                      <span className="trend up"><i className="fas fa-arrow-up"></i> 2 new</span>
                    </div>
                  </div>
                  {permissions.billing[currentRole] && (
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}><i className="fas fa-dollar-sign"></i></div>
                      <div className="stat-info">
                        <h3>$12.4K</h3>
                        <p>Today's Revenue</p>
                        <span className="trend up"><i className="fas fa-arrow-up"></i> 8.3%</span>
                      </div>
                    </div>
                  )}
                  {permissions.staff[currentRole] && (
                    <div className="stat-card">
                      <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}><i className="fas fa-user-tie"></i></div>
                      <div className="stat-info">
                        <h3>24</h3>
                        <p>Active Staff</p>
                        <span className="trend up"><i className="fas fa-arrow-up"></i> 2 hired</span>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr' : '1fr', gap: '20px' }}>
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr><th>Recent Activity</th><th>Type</th><th>Time</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {recentActivities.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No recent activities.</td></tr>
                        ) : (
                          recentActivities.map(activity => (
                            <tr key={activity.id}>
                              <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{activity.text}</td>
                              <td><span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(13,148,136,0.08)', color: 'var(--primary)' }}>{activity.type}</span></td>
                              <td>{activity.time}</td>
                              <td><span className={`patient-status ${activity.status}`}><span className="dot"></span>{activity.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Today's Schedule</h3>
                    <div>
                      {appointments.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '10px 0' }}>No appointments scheduled.</div>
                      ) : (
                        appointments.slice(0, 3).map(apt => (
                          <div key={apt._id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ width: '4px', height: '40px', borderRadius: '2px', background: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}></div>
                            <div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{apt.time}</div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{apt.patientName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{apt.service || apt.type || 'Consultation'}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Patients Page */}
            {currentPage === 'patients' && (
              <section className="page-section active" id="page-patients">
                <div className="section-header">
                  <h2>Patients <span className="count">{filteredPatients.length} patients registered</span></h2>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={() => showToast('Exporting patient data...', 'success')}>
                      <i className="fas fa-download"></i> Export
                    </button>
                    {writePermissions[currentRole]?.includes('patients') && (
                      <button className="btn-primary" onClick={openAddPatientModal}>
                        <i className="fas fa-plus"></i> Add Patient
                      </button>
                    )}
                  </div>
                </div>

                <div className="patient-search-bar">
                  <div className="search-wrap">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Search by name, phone, or email..." 
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                  </div>
                  <select 
                    value={patientStatusFilter}
                    onChange={(e) => setPatientStatusFilter(e.target.value)}
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="patients-grid">
                  {filteredPatients.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                      <i className="fas fa-search" style={{ fontSize: '40px', opacity: 0.3, marginBottom: '16px', display: 'block' }}></i>
                      <p style={{ fontSize: '15px', fontWeight: 500 }}>No patients found</p>
                      <p style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search or filter criteria.</p>
                    </div>
                  ) : (
                    filteredPatients.map((p, idx) => (
                      <div key={p._id || p.id} className="patient-card" onClick={() => viewPatient(p)}>
                        <div className="patient-card-top">
                          <div className="patient-avatar" style={{ background: avatarColors[idx % avatarColors.length] }}>{p.firstName.charAt(0)}{p.lastName.charAt(0)}</div>
                          <div className="info">
                            <h4>{p.firstName} {p.lastName}</h4>
                            <div className="since">Since {p.since || 'May 2026'}</div>
                          </div>
                          <div className="patient-card-actions" onClick={(e) => e.stopPropagation()}>
                            {writePermissions[currentRole]?.includes('patients') && (
                              <>
                                <button onClick={() => editPatient(p)} title="Edit"><i className="fas fa-pen"></i></button>
                                <button className="del-btn" onClick={() => deletePatient(p._id || p.id)} title="Delete"><i className="fas fa-trash"></i></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="patient-details">
                          <div className="patient-detail-row"><i className="fas fa-phone"></i> {p.phone}</div>
                          <div className="patient-detail-row"><i className="fas fa-envelope"></i> {p.email}</div>
                          <div className="patient-detail-row"><i className="fas fa-cake-candles"></i> {formatDate(p.dob || p.dateOfBirth)}</div>
                        </div>
                        <span className={`patient-status ${p.status}`}><span className="dot"></span>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
                        
                        {/* Inline Delete Confirmation */}
                        {confirmingDelete === (p._id || p.id) && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', gap: '12px', borderRadius: '14px', zIndex: 5, justifyContent: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)' }}>Delete {p.firstName} {p.lastName}?</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={cancelDelete}>Cancel</button>
                              <button className="btn-danger" style={{ padding: '6px 16px', fontSize: '12px' }} onClick={() => confirmDelete(p._id || p.id)}><i className="fas fa-trash"></i> Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Appointments Page */}
            {currentPage === 'appointments' && (
              <section className="page-section active" id="page-appointments">
                <div className="section-header">
                  <h2>Appointments <span className="count">3 upcoming</span></h2>
                  <button className="btn-primary" onClick={() => showToast('Appointment scheduling coming soon', 'warning')}>
                    <i className="fas fa-plus"></i> New Appointment
                  </button>
                </div>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No appointments found</td></tr>
                      ) : (
                        appointments.map(apt => (
                          <tr key={apt._id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{apt.patientName}</td>
                            <td>{apt.doctor}</td>
                            <td>{apt.date}</td>
                            <td>{apt.time}</td>
                            <td><span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(13,148,136,0.08)', color: 'var(--primary)' }}>{apt.service || apt.type || 'Consultation'}</span></td>
                            <td><span className={`patient-status ${apt.status?.toLowerCase() === 'confirmed' ? 'active' : apt.status?.toLowerCase() === 'pending' ? 'pending' : 'inactive'}`}><span className="dot"></span>{apt.status}</span></td>
                            <td><button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => showToast(`Edit appointment: ${apt.patientName}`, 'success')}><i className="fas fa-pen"></i></button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Calendar Page */}
            {currentPage === 'calendar' && (
              <section className="page-section active" id="page-calendar">
                <div className="section-header">
                  <h2>Calendar <span className="count">{calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span></h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" onClick={() => changeMonth(-1)}><i className="fas fa-chevron-left"></i></button>
                    <button className="btn-secondary" onClick={() => changeMonth(0)}>Today</button>
                    <button className="btn-secondary" onClick={() => changeMonth(1)}><i className="fas fa-chevron-right"></i></button>
                  </div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                  <div className="calendar-grid">
                    {renderCalendarGrid()}
                  </div>
                </div>
              </section>
            )}

            {/* AI Logs Page */}
            {currentPage === 'ai-logs' && (
              <section className="page-section active" id="page-ai-logs">
                <div className="section-header">
                  <h2>AI Logs <span className="count">{aiLogs.length} actions logged</span></h2>
                </div>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr><th>Action</th><th>Details</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                      {aiLogs.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No AI actions logged yet.</td></tr>
                      ) : (
                        aiLogs.map(log => (
                          <tr key={log.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</td>
                            <td>{log.details}</td>
                            <td><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.time}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Notifications Page */}
            {currentPage === 'notifications' && (
              <section className="page-section active" id="page-notifications">
                <div className="section-header"><h2>All Notifications</h2></div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Message</th><th>Time</th></tr></thead>
                    <tbody>
                      <tr><td>New appointment booked by Sarah.</td><td>10 min ago</td></tr>
                      <tr><td>Lab results ready for Michael.</td><td>1 hr ago</td></tr>
                      <tr><td>System update completed successfully.</td><td>2 hrs ago</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Issues Page */}
            {currentPage === 'issues' && (
              <section className="page-section active" id="page-issues">
                <div className="section-header"><h2>Support Issues</h2></div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Issue</th><th>Reported By</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr><td>Login issue reported by Nurse Amy.</td><td>Nurse Amy</td><td><span className="patient-status pending"><span className="dot"></span>Pending</span></td></tr>
                      <tr><td>Printer not working at reception.</td><td>Tom Bradley</td><td><span className="patient-status active"><span className="dot"></span>Open</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Medical Records Page */}
            {currentPage === 'records' && (
              <section className="page-section active" id="page-records">
                <div className="section-header"><h2>Medical Records</h2></div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Patient</th><th>Diagnosis</th><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sarah Johnson</td>
                        <td>Type 2 Diabetes Mellitus</td>
                        <td>Dr. Mitchell</td>
                        <td>May 10, 2026</td>
                        <td><span className="patient-status active"><span className="dot"></span>Active</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Michael Chen</td>
                        <td>Hypertension</td>
                        <td>Dr. Mitchell</td>
                        <td>May 11, 2026</td>
                        <td><span className="patient-status active"><span className="dot"></span>Active</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>David Miller</td>
                        <td>Ankle Fracture</td>
                        <td>Dr. Mitchell</td>
                        <td>May 09, 2026</td>
                        <td><span className="patient-status inactive"><span className="dot"></span>Inactive</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Prescriptions Page */}
            {currentPage === 'prescriptions' && (
              <section className="page-section active" id="page-prescriptions">
                <div className="section-header">
                  <h2>Prescriptions</h2>
                  <button className="btn-primary" onClick={() => showToast('New prescription form coming soon', 'warning')}>
                    <i className="fas fa-plus"></i> New Prescription
                  </button>
                </div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Patient</th><th>Medication</th><th>Dosage</th><th>Prescribed By</th><th>Date</th></tr></thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sarah Johnson</td>
                        <td>Metformin 500mg</td>
                        <td>Twice daily</td>
                        <td>Dr. Mitchell</td>
                        <td>May 10, 2026</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Michael Chen</td>
                        <td>Lisinopril 10mg</td>
                        <td>Once daily</td>
                        <td>Dr. Mitchell</td>
                        <td>May 11, 2026</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Emily Davis</td>
                        <td>Amoxicillin 500mg</td>
                        <td>Thrice daily</td>
                        <td>Dr. Mitchell</td>
                        <td>May 08, 2026</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Lab Results Page */}
            {currentPage === 'lab' && (
              <section className="page-section active" id="page-lab">
                <div className="section-header"><h2>Lab Results</h2></div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Patient</th><th>Test</th><th>Result</th><th>Reference</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sarah Johnson</td>
                        <td>HbA1c</td>
                        <td style={{ fontWeight: 600, color: 'var(--warning)' }}>7.2%</td>
                        <td>&lt;6.5%</td>
                        <td><span className="patient-status pending"><span className="dot"></span>Review</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Michael Chen</td>
                        <td>Lipid Profile</td>
                        <td style={{ fontWeight: 600, color: 'var(--warning)' }}>210 mg/dL</td>
                        <td>&lt;200 mg/dL</td>
                        <td><span className="patient-status pending"><span className="dot"></span>Review</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Lisa Park</td>
                        <td>CBC</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>Normal</td>
                        <td>Normal Range</td>
                        <td><span className="patient-status active"><span className="dot"></span>Completed</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Billing Page */}
            {currentPage === 'billing' && (
              <section className="page-section active" id="page-billing">
                <div className="section-header"><h2>Billing</h2></div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#INV-1042</td>
                        <td>Lisa Park</td>
                        <td style={{ fontWeight: 600 }}>$350.00</td>
                        <td>May 11, 2026</td>
                        <td><span className="patient-status active"><span className="dot"></span>Paid</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#INV-1043</td>
                        <td>Michael Chen</td>
                        <td style={{ fontWeight: 600 }}>$150.00</td>
                        <td>May 11, 2026</td>
                        <td><span className="patient-status pending"><span className="dot"></span>Pending</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#INV-1044</td>
                        <td>Sarah Johnson</td>
                        <td style={{ fontWeight: 600 }}>$200.00</td>
                        <td>May 10, 2026</td>
                        <td><span className="patient-status active"><span className="dot"></span>Paid</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Inventory Page */}
            {currentPage === 'inventory' && (
              <section className="page-section active" id="page-inventory">
                <div className="section-header"><h2>Inventory</h2></div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Surgical Masks</td>
                        <td>PPE</td>
                        <td style={{ fontWeight: 600 }}>1250</td>
                        <td>500</td>
                        <td><span className="patient-status active"><span className="dot"></span>In Stock</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Gloves (Box of 100)</td>
                        <td>PPE</td>
                        <td style={{ fontWeight: 600 }}>50</td>
                        <td>100</td>
                        <td><span className="patient-status inactive"><span className="dot"></span>Low Stock</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Syringes (Pack of 50)</td>
                        <td>Consumables</td>
                        <td style={{ fontWeight: 600 }}>300</td>
                        <td>100</td>
                        <td><span className="patient-status active"><span className="dot"></span>In Stock</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Staff Page */}
            {currentPage === 'staff' && (
              <section className="page-section active" id="page-staff">
                <div className="section-header">
                  <h2>Staff Management</h2>
                  <button className="btn-primary" onClick={() => showToast('Staff management module ready', 'success')}>
                    <i className="fas fa-plus"></i> Add Staff
                  </button>
                </div>
                <div className="data-table">
                  <table>
                    <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Email</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. Sarah Mitchell</td>
                        <td><span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(13,148,136,0.08)', color: 'var(--primary)' }}>Doctor</span></td>
                        <td>General Medicine</td>
                        <td>s.mitchell@medbook.ai</td>
                        <td><span className="patient-status active"><span className="dot"></span>Active</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Nurse Amy Collins</td>
                        <td><span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(13,148,136,0.08)', color: 'var(--primary)' }}>Nurse</span></td>
                        <td>Pediatrics</td>
                        <td>nurse@medbook.ai</td>
                        <td><span className="patient-status active"><span className="dot"></span>Active</span></td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tom Bradley</td>
                        <td><span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(13,148,136,0.08)', color: 'var(--primary)' }}>Receptionist</span></td>
                        <td>Front Desk</td>
                        <td>recep@medbook.ai</td>
                        <td><span className="patient-status active"><span className="dot"></span>Active</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Access Control Page */}
            {currentPage === 'access' && (
              <section className="page-section active" id="page-access">
                <div className="section-header"><h2>Access Control</h2></div>
                <div className="settings-card">
                  <h3>Role-Based Permission Matrix</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Manage which features each role can access. Changes take effect immediately upon next login.</p>
                  <div className="data-table">
                    <table className="access-matrix">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Feature</th>
                          <th>Admin</th>
                          <th>Doctor</th>
                          <th>Nurse</th>
                          <th>Receptionist</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(permissions).map(key => (
                          <tr key={key}>
                            <td style={{ textAlign: 'left', fontWeight: 500, color: 'var(--text-primary)' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                            <td><i className={`fas ${permissions[key].admin ? 'fa-check-circle granted' : 'fa-times-circle denied'} access-icon`}></i></td>
                            <td><i className={`fas ${permissions[key].doctor ? 'fa-check-circle granted' : 'fa-times-circle denied'} access-icon`}></i></td>
                            <td><i className={`fas ${permissions[key].nurse ? 'fa-check-circle granted' : 'fa-times-circle denied'} access-icon`}></i></td>
                            <td><i className={`fas ${permissions[key].receptionist ? 'fa-check-circle granted' : 'fa-times-circle denied'} access-icon`}></i></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Reports Page */}
            {currentPage === 'reports' && (
              <section className="page-section active" id="page-reports">
                <div className="section-header"><h2>Reports & Analytics</h2></div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--primary)' }}><i className="fas fa-chart-line"></i></div>
                    <div className="stat-info">
                      <h3>89%</h3>
                      <p>Patient Satisfaction</p>
                      <span className="trend up"><i className="fas fa-arrow-up"></i> 4.2%</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Weekly Patient Visits</h3>
                  <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 10px' }}>
                    {[28, 35, 22, 40, 32, 15, 8].map((val, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
                        <div style={{ width: '100%', maxWidth: '48px', height: `${(val/40)*180}px`, background: 'linear-gradient(180deg,var(--primary),rgba(13,148,136,0.3))', borderRadius: '8px 8px 4px 4px' }}></div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Settings Page */}
            {currentPage === 'settings' && (
              <section className="page-section active" id="page-settings">
                <div className="section-header"><h2>Settings</h2></div>
                <div className="settings-card">
                  <h3>General Preferences</h3>
                  <div className="setting-row">
                    <div><div className="label">Email Notifications</div><div className="desc">Receive email alerts for new appointments</div></div>
                    <div className="toggle-switch on"></div>
                  </div>
                </div>
              </section>
            )}

          </main>
        </div>
      </div>

      {/* Add/Edit Patient Modal */}
      {activeModal === 'patientModal' && (
        <div className="modal-overlay open" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{patientForm.id ? 'Edit Patient' : 'Add New Patient'}</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label>First Name</label><input type="text" value={patientForm.firstName} onChange={(e) => setPatientForm({...patientForm, firstName: e.target.value})} placeholder="First name" /></div>
                <div className="form-group"><label>Last Name</label><input type="text" value={patientForm.lastName} onChange={(e) => setPatientForm({...patientForm, lastName: e.target.value})} placeholder="Last name" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input type="tel" value={patientForm.phone} onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})} placeholder="+1 (555) 000-0000" /></div>
                <div className="form-group"><label>Email</label><input type="email" value={patientForm.email} onChange={(e) => setPatientForm({...patientForm, email: e.target.value})} placeholder="patient@email.com" /></div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={patientForm.dob} onChange={(e) => setPatientForm({...patientForm, dob: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={patientForm.status} onChange={(e) => setPatientForm({...patientForm, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={patientForm.address} onChange={(e) => setPatientForm({...patientForm, address: e.target.value})} placeholder="Full address" />
              </div>
              <div className="form-group">
                <label>Medical Notes</label>
                <textarea value={patientForm.notes} onChange={(e) => setPatientForm({...patientForm, notes: e.target.value})} rows="3" placeholder="Any relevant medical history or notes..." style={{ resize: 'vertical' }}></textarea>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button className="btn-primary" onClick={savePatient}><i className="fas fa-check"></i> Save Patient</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {activeModal === 'viewPatientModal' && viewingPatient && (
        <div className="modal-overlay open" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Patient Details</h3>
              <button className="modal-close" onClick={() => setActiveModal(null)}><i className="fas fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div className="patient-avatar" style={{ width: '64px', height: '64px', fontSize: '22px', borderRadius: '16px', background: 'var(--primary)' }}>{viewingPatient.firstName.charAt(0)}{viewingPatient.lastName.charAt(0)}</div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{viewingPatient.firstName} {viewingPatient.lastName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Registered since {viewingPatient.since}</p>
                  <span className={`patient-status ${viewingPatient.status}`} style={{ marginTop: '6px' }}><span className="dot"></span>{viewingPatient.status.charAt(0).toUpperCase() + viewingPatient.status.slice(1)}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '14px', background: 'var(--content-bg)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{viewingPatient.phone}</div>
                </div>
                <div style={{ padding: '14px', background: 'var(--content-bg)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{viewingPatient.email}</div>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {writePermissions[currentRole]?.includes('patients') && (
                  <button className="btn-primary" onClick={() => { setActiveModal(null); editPatient(viewingPatient); }}><i className="fas fa-pen"></i> Edit Patient</button>
                )}
                <button className="btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Chat Widget */}
      <div className={`ai-widget ${aiOpen ? 'open' : ''}`} style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
        width: aiOpen ? '350px' : '60px', height: aiOpen ? '500px' : '60px',
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: aiOpen ? '18px' : '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {!aiOpen ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--primary)', color: 'white' }} onClick={() => setAiOpen(true)}>
            <i className="fas fa-robot" style={{ fontSize: '24px' }}></i>
          </div>
        ) : (
          <>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-robot"></i>
                <span style={{ fontWeight: 600 }}>AI Assistant</span>
              </div>
              <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setAiOpen(false)}>
                <i className="fas fa-xmark"></i>
              </button>
            </div>
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {aiMessages.map((msg, idx) => (
                <div key={idx} style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: '12px',
                  fontSize: '13px', lineHeight: '1.4',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--content-bg)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)'
                }}>
                  {msg.text}
                </div>
              ))}
              {aiLoading && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--content-bg)', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Thinking...
                </div>
              )}
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={aiInput} 
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
                placeholder="Type a message..." 
                style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', fontSize: '13px', outline: 'none' }}
              />
              <button className="btn-primary" style={{ padding: '0 14px' }} onClick={sendAiMessage} disabled={aiLoading}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
