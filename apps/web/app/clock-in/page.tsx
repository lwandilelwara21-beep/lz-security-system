'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001'}/api/v1`;

type UserSession = {
  employeeNumber: string;
  role: string;
};

type AttendanceEntry = {
  id: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  site?: { name: string } | null;
};

type Confirmation = {
  text: string;
  time: string;
  site: string;
};

export default function EmployeeClockInPage() {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<UserSession | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [activeRecord, setActiveRecord] = useState<AttendanceEntry | null>(null);
  const [lastRecord, setLastRecord] = useState<AttendanceEntry | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAttendance = useCallback(async (token: string) => {
    const response = await fetch(`${API_BASE}/attendance/my-history?limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Could not load attendance status.');

    const records = (result.items ?? []) as AttendanceEntry[];
    setActiveRecord(records.find((record) => record.clockInAt && !record.clockOutAt) ?? null);
    setLastRecord(records[0] ?? null);
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('lz-employee-session');
    const savedToken = localStorage.getItem('lz-employee-token');

    if (!savedSession || !savedToken) return;

    try {
      setSession(JSON.parse(savedSession) as UserSession);
      setAccessToken(savedToken);
      loadAttendance(savedToken).catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Could not load attendance status.');
      });
    } catch {
      localStorage.removeItem('lz-employee-session');
      localStorage.removeItem('lz-employee-token');
    }
  }, [loadAttendance]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeNumber, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Unable to sign in.');

      const nextSession = result.user as UserSession;
      setSession(nextSession);
      setAccessToken(result.accessToken);
      localStorage.setItem('lz-employee-session', JSON.stringify(nextSession));
      localStorage.setItem('lz-employee-token', result.accessToken);
      setPassword('');
      setConfirmation(null);
      await loadAttendance(result.accessToken);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClockAction() {
    if (!session || !accessToken) return;
    setLoading(true);
    setError('');
    setConfirmation(null);

    const clockingOut = Boolean(activeRecord);
    try {
      const response = await fetch(`${API_BASE}/attendance/${clockingOut ? 'clock-out' : 'clock-in'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(clockingOut ? { notes: 'Clocked out via employee portal' } : { device: 'employee-portal' }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Attendance could not be recorded.');

      const eventTime = clockingOut ? result.clockOutAt : result.clockInAt;
      const time = eventTime ? new Date(eventTime).toLocaleString() : new Date().toLocaleString();
      const site = activeRecord?.site?.name ?? lastRecord?.site?.name ?? 'Assigned site';
      setConfirmation({
        text: clockingOut ? 'Clocked out successfully' : 'Clocked in successfully',
        time,
        site,
      });
      await loadAttendance(accessToken);
    } catch (clockError) {
      setError(clockError instanceof Error ? clockError.message : 'Attendance could not be recorded.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('lz-employee-session');
    localStorage.removeItem('lz-employee-token');
    setSession(null);
    setAccessToken('');
    setActiveRecord(null);
    setLastRecord(null);
    setConfirmation(null);
    setError('');
  }

  return (
    <main className="clock-in-shell">
      <header className="clock-in-header">
        <a href="/" className="brand-tag">LZ Solutions</a>
        <span>Employee attendance</span>
      </header>

      <section className="clock-in-panel">
        <p className="eyebrow">SHIFT ATTENDANCE</p>
        <h1>Clock in for your shift</h1>
        <p className="clock-in-intro">Record your attendance at your assigned site.</p>

        {!session ? (
          <form className="clock-in-form" onSubmit={handleLogin}>
            <label htmlFor="staff-number">Employee number</label>
            <input
              id="staff-number"
              autoComplete="username"
              value={employeeNumber}
              onChange={(event) => setEmployeeNumber(event.target.value)}
              placeholder="Enter employee number"
              required
            />
            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
            />
            <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in to clock'}</button>
          </form>
        ) : (
          <div className="clock-in-action">
            <div className="employee-identity">
              <span>Signed in as</span>
              <strong>{session.employeeNumber}</strong>
            </div>
            <div className={`shift-status ${activeRecord ? 'shift-active' : 'shift-inactive'}`} aria-live="polite">
              <span className="status-label">CURRENT SHIFT</span>
              <h2>{activeRecord ? 'You are clocked in' : 'You are not clocked in'}</h2>
              <p>{activeRecord
                ? `Clocked in at ${new Date(activeRecord.clockInAt as string).toLocaleString()}${activeRecord.site?.name ? ` at ${activeRecord.site.name}` : ''}.`
                : 'Clock in when you are ready to begin your shift.'}</p>
            </div>
            <button type="button" className="clock-action-button" onClick={handleClockAction} disabled={loading}>
              {loading ? 'Recording...' : activeRecord ? 'Clock out' : 'Clock in'}
            </button>
            {lastRecord && !activeRecord ? (
              <p className="last-shift">Last shift: {lastRecord.clockInAt ? new Date(lastRecord.clockInAt).toLocaleString() : 'No clock-in time'}{lastRecord.site?.name ? ` at ${lastRecord.site.name}` : ''}</p>
            ) : null}
            <button type="button" className="button-secondary kiosk-logout" onClick={handleLogout}>Sign out</button>
          </div>
        )}

        {confirmation ? (
          <div className="clock-confirmation" role="status" aria-live="assertive">
            <span className="confirmation-mark" aria-hidden="true">OK</span>
            <div>
              <strong>{confirmation.text}</strong>
              <span>{confirmation.time} · {confirmation.site}</span>
            </div>
          </div>
        ) : null}
        {error ? <div className="error-box" role="alert">{error}</div> : null}
      </section>
      <footer className="clock-in-footer">LZ Security Operations</footer>
    </main>
  );
}
