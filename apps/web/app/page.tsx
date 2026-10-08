'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '../lib/api';

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001'}/api/v1`;

type DashboardSummary = {
  totalEmployees: number;
  activeEmployees: number;
  lateArrivals: number;
  activeSites: number;
};

type UserSession = {
  id: string;
  employeeNumber: string;
  email: string;
  companyId: string;
  role: string;
};

type AttendanceEntry = {
  id: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  status: string;
  site?: { name: string } | null;
};

export default function HomePage() {
  const router = useRouter();
  const localDemo = process.env.NODE_ENV !== 'production';
  const [employeeNumber, setEmployeeNumber] = useState(localDemo ? 'ADMIN001' : '');
  const [password, setPassword] = useState(localDemo ? 'Admin@123' : '');
  const [session, setSession] = useState<UserSession | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalEmployees: 0,
    activeEmployees: 0,
    lateArrivals: 0,
    activeSites: 0,
  });
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [employeeForm, setEmployeeForm] = useState({
    employeeNumber: 'EMP1001',
    firstName: 'John',
    lastName: 'Security',
    phoneNumber: '0710000000',
    password: '',
    siteId: '',
  });
  const [siteForm, setSiteForm] = useState({
    name: 'Patrol Base',
    address: 'Main gate',
  });

  const authenticated = Boolean(session && accessToken);

  const loadDashboard = useCallback(async (authToken: string) => {
    if (!authToken) return;

    try {
      const [summaryRequest, sitesRequest, historyRequest] = await Promise.all([
        authenticatedFetch('/dashboard/summary', authToken, 'lz-security-token', 'lz-security-refresh'),
        authenticatedFetch('/sites?limit=100', authToken, 'lz-security-token', 'lz-security-refresh'),
        authenticatedFetch('/attendance/my-history?limit=10', authToken, 'lz-security-token', 'lz-security-refresh'),
      ]);

      const summaryResult = summaryRequest.response;
      const sitesResult = sitesRequest.response;
      const historyResult = historyRequest.response;
      const nextToken = summaryRequest.accessToken;
      if (nextToken !== authToken) setAccessToken(nextToken);

      if ([summaryResult, sitesResult, historyResult].some((response) => response.status === 401)) {
        localStorage.removeItem('lz-security-session');
        localStorage.removeItem('lz-security-token');
        localStorage.removeItem('lz-security-refresh');
        setSession(null);
        setAccessToken('');
        setMessage('Your administrator session expired. Please sign in again.');
        return;
      }

      const summaryData = await summaryResult.json();
      const sitesData = await sitesResult.json();
      const historyData = await historyResult.json();

      if (summaryResult.ok) {
        setSummary({
          totalEmployees: summaryData.totalEmployees ?? 0,
          activeEmployees: summaryData.currentlyClockedIn ?? 0,
          lateArrivals: summaryData.lateEmployees ?? 0,
          activeSites: summaryData.activeSites ?? 0,
        });
      }

      if (sitesResult.ok && Array.isArray(sitesData.items)) {
        setSites(sitesData.items);
        setEmployeeForm((current) => ({
          ...current,
          siteId: current.siteId || sitesData.items[0]?.id || '',
        }));
      }

      if (historyResult.ok && Array.isArray(historyData.items)) {
        setAttendance(historyData.items);
      }
    } catch {
      setMessage('Login succeeded, but dashboard data is unavailable right now.');
    }
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('lz-security-session');
    const savedToken = localStorage.getItem('lz-security-token');

    if (savedSession && savedToken) {
      const parsedSession = JSON.parse(savedSession) as UserSession;
      if (parsedSession.role === 'SUPER_ADMIN' || parsedSession.role === 'COMPANY_ADMIN') {
        setSession(parsedSession);
        setAccessToken(savedToken);
        loadDashboard(savedToken);
      } else {
        router.replace('/clock-in');
      }
    }
  }, [loadDashboard, router]);

  async function apiRequest(path: string, method = 'GET', body?: unknown) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const init = { method, headers, body: body ? JSON.stringify(body) : undefined };
    const request = accessToken
      ? await authenticatedFetch(path, accessToken, 'lz-security-token', 'lz-security-refresh', init)
      : { response: await fetch(`${API_BASE}${path}`, init), accessToken: '' };
    const response = request.response;
    if (request.accessToken && request.accessToken !== accessToken) setAccessToken(request.accessToken);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await apiRequest('/auth/login', 'POST', {
        employeeNumber,
        password,
      });

      const nextSession = result.user as UserSession;
      if (nextSession.role !== 'SUPER_ADMIN' && nextSession.role !== 'COMPANY_ADMIN') {
        localStorage.setItem('lz-employee-session', JSON.stringify(nextSession));
        localStorage.setItem('lz-employee-token', result.accessToken);
        localStorage.setItem('lz-employee-refresh', result.refreshToken);
        router.push('/clock-in');
        return;
      }

      setSession(nextSession);
      setAccessToken(result.accessToken);
      localStorage.setItem('lz-security-session', JSON.stringify(nextSession));
      localStorage.setItem('lz-security-token', result.accessToken);
      localStorage.setItem('lz-security-refresh', result.refreshToken);
      setMessage('Administrator login successful.');
      await loadDashboard(result.accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEmployee(event: FormEvent) {
    event.preventDefault();
    if (!authenticated) {
      setMessage('Please log in to create an employee.');
      return;
    }

    try {
      const result = await apiRequest('/employees', 'POST', {
        ...employeeForm,
        active: true,
      });

      setMessage(`Employee ${result.employeeNumber ?? employeeForm.employeeNumber} created with clock-in access.`);
      setEmployeeForm({
        employeeNumber: 'EMP1002',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        siteId: sites[0]?.id ?? '',
      });
      await loadDashboard(accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Employee creation failed.');
    }
  }

  async function handleCreateSite(event: FormEvent) {
    event.preventDefault();
    if (!authenticated) {
      setMessage('Please log in to create a site.');
      return;
    }

    try {
      const result = await apiRequest('/sites', 'POST', {
        ...siteForm,
        active: true,
      });

      setMessage(`Site ${result.name ?? siteForm.name} created successfully.`);
      setSiteForm({ name: '', address: '' });
      await loadDashboard(accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Site creation failed.');
    }
  }

  function handleLogout() {
    localStorage.removeItem('lz-security-session');
    localStorage.removeItem('lz-security-token');
    localStorage.removeItem('lz-security-refresh');
    setSession(null);
    setAccessToken('');
    setMessage('You have been logged out.');
  }

  return (
    <main className="page-shell admin-shell">
      <section className="dashboard-panel">
        <header className="admin-header">
          <div>
            <span className="brand-tag">LZ Solutions</span>
            <h1>Administrator dashboard</h1>
          </div>
          {authenticated ? (
            <div className="admin-session">
              <span>{session?.employeeNumber}</span>
              <button type="button" className="button-secondary" onClick={handleLogout}>Log out</button>
            </div>
          ) : null}
        </header>

        {!authenticated ? (
          <div className="admin-login-layout">
            <form onSubmit={handleLogin} className="management-card admin-login-form">
              <h2>Administrator sign in</h2>
              <label htmlFor="admin-employee-number">Employee number</label>
              <input
                id="admin-employee-number"
                type="text"
                value={employeeNumber}
                onChange={(event) => setEmployeeNumber(event.target.value)}
                placeholder="Enter your employee number"
                autoComplete="username"
                required
              />
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
              {localDemo ? (
                <div className="demo-credentials" role="note">
                  <strong>Local demo accounts</strong>
                  <span>Administrator: ADMIN001 / Admin@123</span>
                  <span>Employee clock-in: DEMO001 / Officer@123</span>
                </div>
              ) : null}
              {message ? <div className="message-box" role="status">{message}</div> : null}
              <a className="employee-portal-link" href="/clock-in">Go to employee clock-in</a>
            </form>
          </div>
        ) : (
          <>
            {message ? <div className="message-box" role="status">{message}</div> : null}
            <h2>Operations overview</h2>
            <div className="stats-grid">
              <article><span>Total employees</span><strong>{summary.totalEmployees}</strong></article>
              <article><span>Clocked in</span><strong>{summary.activeEmployees}</strong></article>
              <article><span>Late arrivals</span><strong>{summary.lateArrivals}</strong></article>
              <article><span>Active sites</span><strong>{summary.activeSites}</strong></article>
            </div>

            <div className="management-grid">
              <form id="employees" className="management-card" onSubmit={handleCreateEmployee}>
                <h3>Employee management</h3>
                <div className="field-row">
                  <input placeholder="Employee number" value={employeeForm.employeeNumber} onChange={(event) => setEmployeeForm((current) => ({ ...current, employeeNumber: event.target.value }))} required />
                  <input placeholder="Phone" value={employeeForm.phoneNumber} onChange={(event) => setEmployeeForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
                </div>
                <div className="field-row">
                  <input type="password" minLength={8} autoComplete="new-password" placeholder="Initial password (8+ characters)" value={employeeForm.password} onChange={(event) => setEmployeeForm((current) => ({ ...current, password: event.target.value }))} required />
                  <select aria-label="Assign site" value={employeeForm.siteId} onChange={(event) => setEmployeeForm((current) => ({ ...current, siteId: event.target.value }))} required>
                    {sites.length === 0 ? <option value="">Create a site first</option> : sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                  </select>
                </div>
                <div className="field-row">
                  <input placeholder="First name" value={employeeForm.firstName} onChange={(event) => setEmployeeForm((current) => ({ ...current, firstName: event.target.value }))} required />
                  <input placeholder="Last name" value={employeeForm.lastName} onChange={(event) => setEmployeeForm((current) => ({ ...current, lastName: event.target.value }))} required />
                </div>
                <button type="submit">Create employee</button>
              </form>

              <form id="sites" className="management-card" onSubmit={handleCreateSite}>
                <h3>Site management</h3>
                <div className="field-row">
                  <input placeholder="Site name" value={siteForm.name} onChange={(event) => setSiteForm((current) => ({ ...current, name: event.target.value }))} required />
                  <input placeholder="Location" value={siteForm.address} onChange={(event) => setSiteForm((current) => ({ ...current, address: event.target.value }))} />
                </div>
                <button type="submit">Create site</button>
              </form>
            </div>

            <section id="attendance" className="attendance-section">
              <h3>Recent attendance</h3>
              <a className="employee-portal-link" href="/clock-in">Open employee clock-in</a>
              {attendance.length === 0 ? <p>No attendance records yet.</p> : (
                <div className="attendance-list">
                  {attendance.map((record) => (
                    <article key={record.id}>
                      <strong>{record.site?.name ?? 'Unassigned site'}</strong>
                      <span>{record.clockInAt ? new Date(record.clockInAt).toLocaleString() : 'No clock-in'}</span>
                      <span>{record.clockOutAt ? `Clocked out ${new Date(record.clockOutAt).toLocaleTimeString()}` : 'Currently on shift'}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
