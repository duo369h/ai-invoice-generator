export default function WorkflowContinuitySection() {
  return (
    <section className="section-workflow-continuity" aria-labelledby="continuity-headline">
      <div className="container">
        <div className="continuity-grid">
          {/* Left Column: Copy & Hierarchy */}
          <div className="copy-col">
            <span className="eyebrow">ONE JOB, ONE CONTINUOUS RECORD</span>
            <h2 id="continuity-headline" className="headline">Stop rebuilding the same project at every step.</h2>
            <p className="body-text">
              Corvioz carries the approved scope, client details, pricing, and status from quote to invoice—so every handoff stays consistent.
            </p>

            {/* Primary Conclusion: Supporting Statement */}
            <div className="supporting-statement-box">
              <p className="supporting-statement">
                No duplicate documents. No lost context. No guessing what changed.
              </p>
            </div>

            {/* Secondary Proof Labels */}
            <div className="proof-pills">
              <span className="proof-pill">
                <svg className="proof-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                1 client record
              </span>
              <span className="proof-pill">
                <svg className="proof-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                1 approved amount
              </span>
              <span className="proof-pill">
                <svg className="proof-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                1 audit trail
              </span>
            </div>
          </div>

          {/* Right Column: Continuous Rail Connected to Project Record Card */}
          <div className="visual-col">
            <div className="rail-card-wrapper">
              {/* Process Rail */}
              <ol className="continuous-rail">
                <li className="rail-node active">
                  <div className="node-indicator" aria-hidden="true"></div>
                  <div className="node-content">
                    <h3 className="node-title">Quote approved</h3>
                    <p className="node-desc">Scope and pricing are confirmed once.</p>
                  </div>
                </li>
                <li className="rail-node active">
                  <div className="node-indicator" aria-hidden="true"></div>
                  <div className="node-content">
                    <h3 className="node-title">Invoice created</h3>
                    <p className="node-desc">Approved details carry forward without re-entry.</p>
                  </div>
                </li>
                <li className="rail-node active node-connecting">
                  <div className="node-indicator" aria-hidden="true"></div>
                  <div className="node-content">
                    <h3 className="node-title">Payment recorded</h3>
                    <p className="node-desc">Balance and history stay attached to the job.</p>
                  </div>
                </li>
              </ol>

              {/* Seamless Connection Stem */}
              <div className="rail-connection-stem" aria-hidden="true">
                <div className="stem-line"></div>
              </div>

              {/* Project Record Card */}
              <div className="project-record-card">
                {/* Top Connection Badge */}
                <div className="card-connector-tag">
                  <svg className="tag-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2.667v10.666M3.333 8L8 12.667 12.667 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Carried forward</span>
                </div>

                <div className="card-header">
                  <div className="project-meta">
                    <span className="meta-label">Client</span>
                    <span className="meta-value">Northline Studio</span>
                  </div>
                  <span className="status-badge" aria-label="Current status: Payment recorded">
                    <span className="badge-dot" aria-hidden="true"></span>
                    Payment recorded
                  </span>
                </div>

                <div className="card-body">
                  <dl className="record-definition-list">
                    <div className="def-group">
                      <dt className="def-label">Project</dt>
                      <dd className="def-value">Commercial Photo Shoot &amp; Licensing</dd>
                    </div>
                    <div className="def-row">
                      <div className="def-group">
                        <dt className="def-label">Approved total</dt>
                        <dd className="def-value font-mono">$4,800</dd>
                      </div>
                      <div className="def-group">
                        <dt className="def-label">Continuous path</dt>
                        <dd className="def-value path-text">Quote → Invoice → Payment recorded</dd>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
