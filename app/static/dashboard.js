const state = {
  overview: null,
  requests: [],
  recentActivity: [],
};

function qs(id) {
  return document.getElementById(id);
}

async function loadJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tooltip(text, label = "More info") {
  return `
    <span class="tooltip-anchor" tabindex="0" aria-label="${escapeHtml(label)}">
      ?
      <span class="tooltip-bubble">${escapeHtml(text)}</span>
    </span>
  `;
}

function formatDate(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function statusPillClass(status) {
  if (status === "approved" || status === "allowed") return "approved";
  if (status === "revoked" || status === "denied") return "revoked";
  return "pending";
}

function showBanner(message) {
  const banner = qs("impact-banner");
  banner.innerHTML = message;
  banner.classList.remove("hidden");
}

function hideBanner() {
  qs("impact-banner").classList.add("hidden");
}

function openDrawer({ eyebrow, title, body }) {
  qs("drawer-eyebrow").textContent = eyebrow;
  qs("drawer-title").textContent = title;
  qs("drawer-body").innerHTML = body;
  qs("drawer-backdrop").classList.remove("hidden");
  qs("detail-drawer").classList.remove("hidden");
  qs("detail-drawer").setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  qs("drawer-backdrop").classList.add("hidden");
  qs("detail-drawer").classList.add("hidden");
  qs("detail-drawer").setAttribute("aria-hidden", "true");
  qs("drawer-body").innerHTML = "";
}

function renderStats(metrics) {
  const grid = qs("stats-grid");
  const cards = [
    {
      label: "Total Agents",
      tooltip: "All registered agents known to the gateway, regardless of approval state.",
      value: metrics.total_agents,
      trend: `${metrics.approved_agents} approved`,
      trendClass: "up",
    },
    {
      label: "Pending Approvals",
      tooltip: "Agents waiting for a human decision before they can receive short-lived scoped credentials.",
      value: metrics.pending_approvals,
      trend: "Requires attention",
      trendClass: "warn",
    },
    {
      label: "Active Tokens",
      tooltip: "Scoped JWT credentials issued after approval. Tokens are short-lived and tied to explicit scopes.",
      value: metrics.active_tokens,
      trend: "Short-lived scoped credentials",
      trendClass: "up",
    },
    {
      label: "Denied Requests",
      tooltip: "Policy-denied actions, including missing scopes, revoked agents or invalid access attempts.",
      value: metrics.denied_requests,
      trend: `${metrics.revoked_agents} revoked agents`,
      trendClass: "down",
    },
  ];
  grid.innerHTML = cards
    .map((card, index) => {
      const spark = metrics.sparkline[index] || [24, 32, 28, 38, 30, 44, 40, 52];
      return `
        <article class="stat-card">
          <div class="stat-header">
            <div class="stat-label">${escapeHtml(card.label)} ${tooltip(card.tooltip, `${card.label} details`)}</div>
          </div>
          <div class="stat-value">${escapeHtml(card.value)}</div>
          <div class="trend ${card.trendClass}">${escapeHtml(card.trend)}</div>
          <div class="sparkline">
            ${spark.map((point) => `<span style="height:${point}px"></span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRequests(rows) {
  const table = qs("requests-table");
  table.innerHTML = rows
    .map((row) => {
      const primaryActionLabel = row.status === "pending" ? "Review request" : "View decision";
      const revokeAction =
        row.status === "approved"
          ? `<button class="action-button warn" type="button" data-action="revoke" data-agent-id="${row.agent_id}">Revoke access</button>`
          : "";

      return `
        <tr>
          <td>
            <div class="agent-name">${escapeHtml(row.agent_name)}</div>
            <div class="agent-subtitle">${escapeHtml(row.agent_type)}</div>
            <div class="tenant-badge">${escapeHtml(row.tenant_id)}</div>
            <div class="table-actions">
              <button class="action-button primary" type="button" data-action="review" data-agent-id="${row.agent_id}">${escapeHtml(primaryActionLabel)}</button>
              ${revokeAction}
            </div>
          </td>
          <td>
            <div class="scope-badges">
              ${row.requested_scopes.map((scope) => `<span class="scope-badge">${escapeHtml(scope)}</span>`).join("")}
            </div>
          </td>
          <td>
            <div>${escapeHtml(row.owner_user_id)}</div>
            <div class="agent-subtitle">${escapeHtml(row.reason)}</div>
          </td>
          <td><span class="decision-pill ${statusPillClass(row.status)}">${escapeHtml(row.status)}</span></td>
          <td>${escapeHtml(row.approval_window)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderScopes(items) {
  const scopeList = qs("scope-list");
  scopeList.innerHTML = items
    .map(
      (item) => `
        <div class="scope-row">
          <div class="scope-head">
            <div class="scope-name">
              ${escapeHtml(item.scope)}
              ${tooltip("This scope must be explicitly approved before an agent can call the mapped tool.", `${item.scope} details`)}
            </div>
            <div class="activity-meta">${escapeHtml(item.count)} agents</div>
          </div>
          <div class="scope-bar"><span style="width:${item.percent}%"></span></div>
        </div>
      `,
    )
    .join("");
}

function renderToolUsage(items) {
  const bars = qs("tool-usage-bars");
  bars.innerHTML = items
    .map(
      (item) => `
        <div class="bar-group">
          <div class="bar-stack">
            <div class="bar allowed" style="height:${item.allowed}px"></div>
            <div class="bar denied" style="height:${item.denied}px"></div>
          </div>
          <div class="bar-label">${escapeHtml(item.label)}</div>
        </div>
      `,
    )
    .join("");
}

function renderPolicies(items) {
  const list = qs("policy-list");
  list.innerHTML = items
    .map(
      (item) => `
        <div class="policy-row">
          <div>
            <div class="policy-name">
              ${escapeHtml(item.name)}
              ${tooltip(item.detail, `${item.name} details`)}
            </div>
            <div class="policy-meta">${escapeHtml(item.detail)}</div>
          </div>
          <span class="decision-pill approved">active</span>
        </div>
      `,
    )
    .join("");
}

function renderActivity(items) {
  const list = qs("activity-list");
  list.innerHTML = items
    .map(
      (item) => `
        <div class="activity-row" data-action="activity" data-audit-id="${item.id}">
          <div class="activity-icon ${escapeHtml(item.decision)}">${escapeHtml(item.icon)}</div>
          <div>
            <div class="activity-title">${escapeHtml(item.title)}</div>
            <div class="activity-meta">${escapeHtml(item.meta)}</div>
          </div>
          <div class="activity-time">${escapeHtml(item.timestamp)}</div>
        </div>
      `,
    )
    .join("");
}

async function refreshDashboard() {
  const [overview, requests, activity] = await Promise.all([
    loadJson("/dashboard/overview"),
    loadJson("/dashboard/access-requests"),
    loadJson("/dashboard/recent-activity"),
  ]);

  state.overview = overview;
  state.requests = requests.rows;
  state.recentActivity = activity.items;

  renderStats(overview.metrics);
  renderRequests(requests.rows);
  renderScopes(overview.scope_distribution);
  renderToolUsage(overview.tool_usage);
  renderPolicies(overview.policy_controls);
  renderActivity(activity.items);
}

function renderDecisionDrawer(item) {
  const body = `
    <div class="timeline-note">
      This decision is traceable: the gateway stores the action, reason, requested scope, policy version and whether PII redaction was applied.
    </div>

    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-label">Decision</div>
        <div class="detail-value"><span class="decision-pill ${statusPillClass(item.decision)}">${escapeHtml(item.decision)}</span></div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Policy Version</div>
        <div class="detail-value">${escapeHtml(item.policy_version || "n/a")}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Tool Name</div>
        <div class="detail-value">${escapeHtml(item.tool_name || "No tool involved")}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Required Scope</div>
        <div class="detail-value">${escapeHtml(item.requested_scope || "n/a")}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Owner</div>
        <div class="detail-value">${escapeHtml(item.owner_user_id || "system")}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">PII Redaction</div>
        <div class="detail-value">${item.pii_redacted ? "Enabled" : "Not required"}</div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Decision Reason</h4>
      <div class="drawer-copy">${escapeHtml(item.meta || "No reason available.")}</div>
    </div>

    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-label">Timestamp</div>
        <div class="detail-value">${escapeHtml(item.timestamp_iso ? formatDate(item.timestamp_iso) : item.timestamp)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Latency</div>
        <div class="detail-value">${item.latency_ms ? `${item.latency_ms} ms` : "n/a"}</div>
      </div>
    </div>
  `;

  openDrawer({
    eyebrow: "Policy Decision",
    title: item.title,
    body,
  });
}

function renderReviewDrawer(agent) {
  const selectedScopes = new Set(agent.approved_scopes?.length ? agent.approved_scopes : agent.requested_scopes);
  const checkboxList = agent.requested_scopes
    .map(
      (scope) => `
        <label class="checkbox-item">
          <input type="checkbox" name="approved_scope" value="${escapeHtml(scope)}" ${selectedScopes.has(scope) ? "checked" : ""} />
          <div>
            <div class="scope-name">${escapeHtml(scope)}</div>
            <div class="policy-meta">Required for the mapped tool call.</div>
          </div>
        </label>
      `,
    )
    .join("");

  const approvalSection =
    agent.status === "pending"
      ? `
        <div class="drawer-section">
          <h4>Approval Flow</h4>
          <div class="drawer-copy">Approve only the scopes you want this agent to receive. Tokens remain short-lived even after approval.</div>
          <form class="review-form" id="approval-form">
            <div class="checkbox-list">${checkboxList}</div>
            <div class="form-grid">
              <div class="field">
                <label for="approved_by">Approved by</label>
                <input id="approved_by" name="approved_by" value="daniel.ozarski" />
              </div>
              <div class="field">
                <label for="expires_in_hours">Expires in hours</label>
                <input id="expires_in_hours" name="expires_in_hours" type="number" min="1" max="168" value="8" />
              </div>
            </div>
            <div class="drawer-actions">
              <button class="action-button primary" type="submit">Approve selected scopes</button>
            </div>
          </form>
        </div>
      `
      : `
        <div class="drawer-section">
          <h4>Approval State</h4>
          <div class="timeline-note">
            ${
              agent.status === "approved"
                ? `Approved by <strong>${escapeHtml(agent.approved_by || "unknown")}</strong>. This agent can request short-lived scoped tokens until the approval window expires.`
                : `This agent is currently <strong>${escapeHtml(agent.status)}</strong>. Future tool calls should fail if revocation has already been applied.`
            }
          </div>
        </div>
      `;

  const revokeSection =
    agent.status === "approved"
      ? `
        <div class="drawer-section">
          <h4>Revocation Impact</h4>
          <div class="drawer-copy">Revoking an agent immediately blocks future tool calls and future token issuance for this identity.</div>
          <form class="review-form" id="revoke-form">
            <div class="field">
              <label for="revocation_reason">Revocation reason</label>
              <textarea id="revocation_reason" name="revocation_reason">Access no longer needed for this workflow.</textarea>
            </div>
            <div class="drawer-actions">
              <button class="action-button warn" type="submit">Revoke agent access</button>
            </div>
          </form>
        </div>
      `
      : "";

  const revokedSummary =
    agent.status === "revoked"
      ? `
        <div class="drawer-section">
          <h4>Revocation Summary</h4>
          <div class="timeline-note">
            Revoked by <strong>${escapeHtml(agent.revoked_by || "unknown")}</strong> on ${escapeHtml(formatDate(agent.revoked_at))}.<br />
            Reason: ${escapeHtml(agent.revocation_reason || "n/a")}
          </div>
        </div>
      `
      : "";

  const body = `
    <div class="detail-grid">
      <div class="detail-card">
        <div class="detail-label">Agent Type</div>
        <div class="detail-value">${escapeHtml(agent.agent_type)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Tenant</div>
        <div class="detail-value">${escapeHtml(agent.tenant_id)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Owner</div>
        <div class="detail-value">${escapeHtml(agent.owner_user_id)}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Status</div>
        <div class="detail-value"><span class="decision-pill ${statusPillClass(agent.status)}">${escapeHtml(agent.status)}</span></div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Created At</div>
        <div class="detail-value">${escapeHtml(formatDate(agent.created_at))}</div>
      </div>
    </div>

    <div class="drawer-section">
      <h4>Requested Scopes</h4>
      <div class="detail-list">
        ${agent.requested_scopes.map((scope) => `<span class="scope-badge">${escapeHtml(scope)}</span>`).join("")}
      </div>
    </div>

    <div class="drawer-section">
      <h4>Business Reason</h4>
      <div class="drawer-copy">${escapeHtml(agent.reason)}</div>
    </div>

    ${approvalSection}
    ${revokeSection}
    ${revokedSummary}
  `;

  openDrawer({
    eyebrow: "Agent Review",
    title: agent.agent_name,
    body,
  });

  const approvalForm = qs("approval-form");
  if (approvalForm) {
    approvalForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(approvalForm);
      const approvedScopes = formData.getAll("approved_scope");
      if (!approvedScopes.length) {
        showBanner("<strong>Approval blocked.</strong> Select at least one scope before approving the agent.");
        return;
      }

      try {
        await loadJson(`/agent-auth/approve/${agent.agent_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approved_scopes: approvedScopes,
            approved_by: formData.get("approved_by"),
            expires_in_hours: Number(formData.get("expires_in_hours")),
          }),
        });
        showBanner(`<strong>Agent approved.</strong> ${escapeHtml(agent.agent_name)} can now request short-lived scoped tokens for ${approvedScopes.length} scope(s).`);
        closeDrawer();
        await refreshDashboard();
      } catch (error) {
        showBanner(`<strong>Approval failed.</strong> ${escapeHtml(error.message)}`);
      }
    });
  }

  const revokeForm = qs("revoke-form");
  if (revokeForm) {
    revokeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(revokeForm);
      const reason = formData.get("revocation_reason");

      try {
        await loadJson(`/agent-auth/revoke/${agent.agent_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            revoked_by: "daniel.ozarski",
            reason,
          }),
        });
        showBanner(
          `<strong>Agent revoked.</strong> ${escapeHtml(agent.agent_name)} has been revoked. Future token issuance and future tool calls will now fail for this agent.`,
        );
        closeDrawer();
        await refreshDashboard();
      } catch (error) {
        showBanner(`<strong>Revocation failed.</strong> ${escapeHtml(error.message)}`);
      }
    });
  }
}

function attachEvents() {
  qs("drawer-close").addEventListener("click", closeDrawer);
  qs("drawer-backdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  qs("requests-table").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const agentId = Number(button.dataset.agentId);
    const agent = state.requests.find((item) => item.agent_id === agentId);
    if (!agent) return;

    if (button.dataset.action === "review" || button.dataset.action === "revoke") {
      hideBanner();
      renderReviewDrawer(agent);
    }
  });

  qs("activity-list").addEventListener("click", (event) => {
    const row = event.target.closest("[data-audit-id]");
    if (!row) return;
    const auditId = Number(row.dataset.auditId);
    const item = state.recentActivity.find((entry) => entry.id === auditId);
    if (!item) return;
    renderDecisionDrawer(item);
  });
}

async function init() {
  attachEvents();
  await refreshDashboard();
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre style="padding:24px;color:#fff;background:#07101d;">${escapeHtml(error.message)}</pre>`;
});
