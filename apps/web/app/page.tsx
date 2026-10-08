export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="login-panel">
        <div className="brand-wrap">
          <span className="brand-tag">LZ Solutions</span>
          <h1>Security Operations</h1>
        </div>

        <div className="clock-card">
          <label htmlFor="employee-number">Employee number</label>
          <input id="employee-number" type="text" placeholder="Enter employee number" />
          <button type="button">Clock in</button>
        </div>

        <div className="info-row">
          <span>Current status</span>
          <strong>Not clocked in</strong>
        </div>

        <div className="mini-panel">
          <h3>Quick actions</h3>
          <ul>
            <li>View attendance</li>
            <li>Manage employees</li>
            <li>Manage sites</li>
          </ul>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Operations overview</h2>
        <div className="stats-grid">
          <article>
            <span>Total employees</span>
            <strong>184</strong>
          </article>
          <article>
            <span>Clocked in</span>
            <strong>126</strong>
          </article>
          <article>
            <span>Late arrivals</span>
            <strong>14</strong>
          </article>
          <article>
            <span>Active sites</span>
            <strong>9</strong>
          </article>
        </div>

        <div className="management-grid">
          <div className="management-card">
            <h3>Employee management</h3>
            <div className="field-row">
              <input placeholder="Employee number" />
              <input placeholder="Name" />
            </div>
            <button type="button">Create employee</button>
          </div>

          <div className="management-card">
            <h3>Site management</h3>
            <div className="field-row">
              <input placeholder="Site name" />
              <input placeholder="Location" />
            </div>
            <button type="button">Create site</button>
          </div>
        </div>
      </section>
    </main>
  );
}
