import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { Metadata } from 'libphonenumber-js/core';
import phoneMetadata from 'libphonenumber-js/metadata.mobile';
import { apiRequest } from './api.js';

const categories = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const userTypes = ['Parent', 'Student', 'School'];
const statuses = ['New', 'In Progress', 'Resolved'];
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countries = getCountries().map((code) => ({
  code,
  name: regionNames.of(code) ?? code,
  dialCode: getCountryCallingCode(code),
  flag: String.fromCodePoint(...code.split('').map((letter) => 127397 + letter.charCodeAt(0))),
})).sort((first, second) => first.name.localeCompare(second.name));

function getPhoneLengthLimits(country) {
  const metadata = new Metadata(phoneMetadata);
  metadata.selectNumberingPlan(country);
  const mobileLengths = metadata.numberingPlan?.type('MOBILE')?.possibleLengths();
  const possibleLengths = mobileLengths?.length ? mobileLengths : metadata.numberingPlan?.possibleLengths();
  const validLengths = possibleLengths?.filter((length) => Number.isInteger(length) && length > 0) ?? [];

  if (validLengths.length === 0) return { min: 6, max: 15 };
  return { min: Math.min(...validLengths), max: Math.max(...validLengths) };
}

function Brand({ admin = false }) {
  return (
    <Link className="brand" to="/" aria-label="EdTech home">
      <span className="brand-mark">e</span>
      <span>edtech<span className="brand-dot">.</span>{admin && <small>INQUIRIES</small>}</span>
    </Link>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      <span aria-hidden="true">{isDark ? '☼' : '☾'}</span>
      <span className="theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}

function PhoneNumberInput({ value, onChange, country, onCountryChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const selectedCountry = countries.find((item) => item.code === country) ?? countries[0];
  const phoneLengthLimits = getPhoneLengthLimits(selectedCountry.code);
  const dialSearch = search.replace(/\D/g, '');
  const matches = countries.filter((item) => (
    item.name.toLowerCase().includes(search.trim().toLowerCase())
    || item.code.toLowerCase() === search.trim().toLowerCase()
    || (dialSearch.length > 0 && item.dialCode.includes(dialSearch))
  )).sort((first, second) => {
    if (!dialSearch) return first.name.localeCompare(second.name);
    const firstRank = first.dialCode === dialSearch ? 0 : first.dialCode.startsWith(dialSearch) ? 1 : 2;
    const secondRank = second.dialCode === dialSearch ? 0 : second.dialCode.startsWith(dialSearch) ? 1 : 2;
    return firstRank - secondRank || first.name.localeCompare(second.name);
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  function chooseCountry(item) {
    onCountryChange(item.code);
    setIsOpen(false);
    setSearch('');
  }

  return (
    <div className="phone-input-control" ref={wrapperRef}>
      <button
        className="country-picker-trigger"
        type="button"
        aria-label={`Country code: ${selectedCountry.name} +${selectedCountry.dialCode}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{selectedCountry.flag}</span>
        <span>+{selectedCountry.dialCode}</span>
        <span className="country-picker-chevron" aria-hidden="true">⌄</span>
      </button>
      <input
        required
        type="tel"
        minLength={phoneLengthLimits.min}
        maxLength={phoneLengthLimits.max}
        name="phone"
        value={value}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, phoneLengthLimits.max);
          onChange({ target: { name: 'phone', value: digits } });
        }}
        placeholder="Phone number"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="tel-national"
        aria-label="Phone number without country code"
      />
      {isOpen && (
        <div className="country-picker-popover">
          <label className="country-search-label">
            <span className="visually-hidden">Search country or calling code</span>
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsOpen(false);
              }}
              placeholder="Search country or code"
              autoComplete="off"
            />
          </label>
          <div className="country-options" role="listbox" aria-label="Countries">
            {matches.map((item) => (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={item.code === selectedCountry.code}
                className="country-option"
                onClick={() => chooseCountry(item)}
              >
                <span className="country-name"><span aria-hidden="true">{item.flag}</span>{item.name}</span>
                <span className="country-dial-code">+{item.dialCode}</span>
              </button>
            ))}
            {matches.length === 0 && <p className="country-no-results">No matching countries.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function PublicForm({ theme, onToggleTheme }) {
  const [form, setForm] = useState({
    userType: '', category: '', name: '', email: '', phone: '', message: '',
  });
  const [phoneCountry, setPhoneCountry] = useState('IN');
  const [state, setState] = useState({ loading: false, error: '', success: false });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setState({ loading: true, error: '', success: false });
    try {
      const callingCode = getCountryCallingCode(phoneCountry);
      const phone = `+${callingCode} ${form.phone.trim()}`;
      await apiRequest('/inquiries', { method: 'POST', body: JSON.stringify({ ...form, phone }) });
      setState({ loading: false, error: '', success: true });
      setForm({ userType: '', category: '', name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setState({ loading: false, error: error.message, success: false });
    }
  }

  return (
    <div className="public-page">
      <header className="topbar">
        <Brand />
        <div className="topbar-right">
          <span className="topbar-note">Here for your next big step</span>
          <Link className="admin-link" to="/admin">Team login <span aria-hidden="true">↗</span></Link>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>
      <main className="inquiry-layout">
        <section className="intro-panel">
          <div className="eyebrow"><span className="eyebrow-line" /> WE'RE ALL EARS</div>
          <h1>Let’s find<br />the right <em>path</em><br />for you.</h1>
          <p>Questions about admissions, scholarships, or programs? Share a few details and we’ll point you in the right direction.</p>
          <div className="intro-bottom">
            <div className="avatar-stack" aria-hidden="true"><span>A</span><span>M</span><span>R</span></div>
            <span>Real people. Thoughtful answers.</span>
          </div>
          <span className="decorative-star" aria-hidden="true">✳</span>
        </section>
        <section className="form-panel">
          <div className="form-heading">
            <div>
              <span className="step-label">LET'S GET STARTED</span>
              <h2>Send us an inquiry</h2>
            </div>
            <span className="form-step">01 <span>/ 01</span></span>
          </div>
          {state.success && <div className="notice success" role="status">Thanks for reaching out. Your inquiry is with our team now.</div>}
          {state.error && <div className="notice error" role="alert">{state.error}</div>}
          <form onSubmit={submit}>
            <div className="form-row">
              <label>
                I am a <span className="required">*</span>
                <select required name="userType" value={form.userType} onChange={update}>
                  <option value="" disabled>Select user type</option>
                  {userTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                I need help with <span className="required">*</span>
                <select required name="category" value={form.category} onChange={update}>
                  <option value="" disabled>Choose a category</option>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Your name <span className="required">*</span>
                <input required minLength="2" maxLength="120" name="name" value={form.name} onChange={update} placeholder="e.g. Alex Morgan" autoComplete="name" />
              </label>
              <label>
                Email address <span className="required">*</span>
                <input required type="email" maxLength="254" name="email" value={form.email} onChange={update} placeholder="alex@example.com" autoComplete="email" />
              </label>
            </div>
            <label>
              Phone number <span className="required">*</span>
              <PhoneNumberInput
                value={form.phone}
                onChange={update}
                country={phoneCountry}
                onCountryChange={(country) => {
                  setPhoneCountry(country);
                  setForm((current) => ({
                    ...current,
                    phone: current.phone.slice(0, getPhoneLengthLimits(country).max),
                  }));
                }}
              />
            </label>
            <label>
              Tell us a little more <span className="required">*</span>
              <textarea required minLength="10" maxLength="5000" rows="4" name="message" value={form.message} onChange={update} placeholder="For example: I’m interested in the admission process for next term. Could you share the requirements and important dates?" />
            </label>
            <div className="form-footer">
              <span><span className="required">*</span> Required fields</span>
              <button className="button button-dark" type="submit" disabled={state.loading}>
                {state.loading ? 'Sending…' : 'Send inquiry'} <span aria-hidden="true">↗</span>
              </button>
            </div>
          </form>
        </section>
      </main>
      <footer className="site-footer"><span>© 2026 EdTech</span><span>Made for curious minds <b>✳</b></span></footer>
    </div>
  );
}

function AdminLogin({ theme, onToggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token } = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      sessionStorage.setItem('adminToken', token);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (sessionStorage.getItem('adminToken')) return <Navigate to="/dashboard" replace />;
  return (
    <main className="login-page">
      <header className="topbar"><Brand admin /><div className="login-header-actions"><ThemeToggle theme={theme} onToggle={onToggleTheme} /><Link className="back-link" to="/">← Back to inquiry form</Link></div></header>
      <section className="login-card">
        <span className="login-icon" aria-hidden="true">↗</span>
        <span className="step-label">STAFF ACCESS</span>
        <h1>Welcome back.</h1>
        <p>Sign in to pick up where your team left off.</p>
        {error && <div className="notice error" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>Email address<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@edtech.com" /></label>
          <label>Password
            <span className="password-input-control">
              <input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
              <button
                className="password-visibility-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 7 9 7a15.8 15.8 0 01-3.1 3.8M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a9.7 9.7 0 003.2-.5" /></svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </span>
          </label>
          <button className="button button-dark button-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span></button>
        </form>
      </section>
      <div className="login-caption">A little progress adds up to a lot. <span>✳</span></div>
    </main>
  );
}

function Dashboard({ theme, onToggleTheme }) {
  const token = sessionStorage.getItem('adminToken');
  const [inquiries, setInquiries] = useState([]);
  const [category, setCategory] = useState('');
  const [userType, setUserType] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (userType) params.set('userType', userType);
    if (appliedSearch) params.set('search', appliedSearch);
    setLoading(true);
    setError('');
    apiRequest(`/inquiries?${params}`, { token })
      .then(({ inquiries: results }) => setInquiries(results))
      .catch((requestError) => {
        setError(requestError.message);
        if (!sessionStorage.getItem('adminToken')) navigate('/admin', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [token, category, userType, appliedSearch, navigate]);

  const summary = useMemo(() => ({
    total: inquiries.length,
    open: inquiries.filter((item) => item.status !== 'Resolved').length,
    resolved: inquiries.filter((item) => item.status === 'Resolved').length,
  }), [inquiries]);

  async function changeStatus(id, status) {
    setUpdatingId(id);
    setError('');
    try {
      const { inquiry } = await apiRequest(`/inquiries/${id}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      });
      setInquiries((current) => current.map((item) => item.id === id ? { ...item, status: inquiry.status } : item));
    } catch (requestError) {
      setError(requestError.message);
      if (!sessionStorage.getItem('adminToken')) navigate('/admin', { replace: true });
    } finally {
      setUpdatingId('');
    }
  }

  function signOut() {
    sessionStorage.removeItem('adminToken');
    navigate('/admin', { replace: true });
  }

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <Brand admin />
        <div className="sidebar-label">WORKSPACE</div>
        <div className="sidebar-item active" aria-current="page"><span className="sidebar-icon" aria-hidden="true">▤</span><span>Inquiries</span><span className="sidebar-count">{summary.total}</span></div>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span aria-hidden="true">✳</span><div><strong>Your team inbox</strong><small>Every conversation counts.</small></div></div>
          <button className="signout-button" onClick={signOut}><span>↪</span> Sign out</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="breadcrumb">Workspace <span>/</span> Inquiries</div>
          <div className="dashboard-header-actions">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="account-chip"><span className="account-avatar">E</span><span>EdTech Admin</span></div>
          </div>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-title-row">
            <div><span className="step-label">YOUR INBOX</span><h1>Inquiry overview</h1><p>Keep track of conversations and help each learner take their next step.</p></div>
            <Link to="/" className="button button-outline">Open public form <span>↗</span></Link>
          </div>
          <div className="stats-row">
            <div className="stat-card stat-card-total">
              <div className="stat-card-top"><span>ALL INQUIRIES</span><span className="stat-icon" aria-hidden="true">↗</span></div>
              <strong>{summary.total}</strong><small>Matching your current filters</small>
            </div>
            <div className="stat-card stat-card-open">
              <div className="stat-card-top"><span>NEEDS ATTENTION</span><span className="stat-icon" aria-hidden="true">✳</span></div>
              <strong>{summary.open}</strong><small>Waiting for a resolution</small>
            </div>
            <div className="stat-card stat-card-resolved">
              <div className="stat-card-top"><span>RESOLVED</span><span className="stat-icon" aria-hidden="true">✓</span></div>
              <strong>{summary.resolved}</strong><small>Successfully completed</small>
            </div>
          </div>
          <section className="inquiries-card">
            <div className="inquiries-heading"><div><h2>Recent inquiries</h2><p>Search, filter, and update your conversations.</p></div><span className="inquiry-count">{summary.total} {summary.total === 1 ? 'result' : 'results'}</span></div>
            <div className="filters">
              <label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search by name or phone" placeholder="Search name or phone…" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>Search</kbd></label>
              <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
              <select aria-label="Filter by user type" value={userType} onChange={(event) => setUserType(event.target.value)}><option value="">All user types</option>{userTypes.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            {error && <div className="notice error dashboard-notice" role="alert">{error}</div>}
            <div className="table-scroll">
              <table>
                <thead><tr><th>CONTACT</th><th>USER TYPE</th><th>CATEGORY</th><th>DATE RECEIVED</th><th>STATUS</th></tr></thead>
                <tbody>
                  {!loading && inquiries.map((item) => (
                    <tr key={item.id}>
                      <td><div className="contact-cell"><span className="contact-avatar">{item.name.trim().charAt(0).toUpperCase()}</span><div><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`} className="phone-link">{item.phone}</a></div></div></td>
                      <td><span className="user-type-tag">{item.userType}</span></td>
                      <td><span className={`category-tag category-${item.category.toLowerCase().replace(/\s/g, '-')}`}>{item.category}</span></td>
                      <td><span className="date-cell">{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.createdAt))}</span></td>
                      <td><select className={`status-select status-${item.status.toLowerCase().replace(/\s/g, '-')}`} aria-label={`Status for ${item.name}`} disabled={updatingId === item.id} value={item.status} onChange={(event) => changeStatus(item.id, event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
                    </tr>
                  ))}
                  {!loading && inquiries.length === 0 && <tr><td className="empty-cell" colSpan="5"><span>✳</span><strong>No inquiries found</strong><small>Try changing a filter, or check back when someone reaches out.</small></td></tr>}
                  {loading && <tr><td className="empty-cell loading-cell" colSpan="5"><span className="spinner" /><strong>Gathering your inquiries…</strong></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{inquiries.length}</strong> {inquiries.length === 1 ? 'conversation' : 'conversations'}</span><span>Updated just now <b>·</b></span></div>
          </section>
          <footer className="dashboard-footer"><span>© 2026 EdTech</span><span>Every good thing starts somewhere. <b>✳</b></span></footer>
        </section>
      </main>
    </div>
  );
}

function ProtectedDashboard({ theme, onToggleTheme }) {
  return sessionStorage.getItem('adminToken')
    ? <Dashboard theme={theme} onToggleTheme={onToggleTheme} />
    : <Navigate to="/admin" replace />;
}

export default function App() {
  const [theme, setTheme] = useState(() => (
    localStorage.getItem('edtech-theme') === 'dark' ? 'dark' : 'light'
  ));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('edtech-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  return (
    <Routes>
      <Route path="/" element={<PublicForm theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/admin" element={<AdminLogin theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/dashboard" element={<ProtectedDashboard theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
