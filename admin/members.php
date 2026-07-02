<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Members';
$db = getDB();

$msg = $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $action = $_POST['action'] ?? '';
    $uid    = (int)($_POST['user_id'] ?? 0);

    if ($uid <= 0 && $action !== '') {
        $err = 'Invalid member ID.';
    } else switch ($action) {

        case 'edit_member':
            $username    = trim($_POST['username']     ?? '');
            $phone       = trim($_POST['phone']        ?? '');
            $email       = trim($_POST['email']        ?? '');
            $referralCode = trim($_POST['referral_code'] ?? '');
            $vipLevel    = (int)($_POST['vip_level']   ?? 0);
            $newPassword = trim($_POST['new_password'] ?? '');
            if ($username === '') { $err = 'Username cannot be empty.'; break; }
            // Check username uniqueness
            $check = $db->prepare("SELECT id FROM users WHERE username = ? AND id <> ?");
            $check->execute([$username, $uid]);
            if ($check->fetch()) { $err = 'Username already taken.'; break; }
            if ($newPassword !== '') {
                $hash = password_hash($newPassword, PASSWORD_BCRYPT);
                $db->prepare("UPDATE users SET username = ?, phone = ?, email = ?, referral_code = ?, vip_level = ?, password_hash = ? WHERE id = ?")
                   ->execute([$username, $phone ?: null, $email ?: null, $referralCode ?: null, $vipLevel, $hash, $uid]);
                $msg = "Member #$uid profile updated (password changed).";
            } else {
                $db->prepare("UPDATE users SET username = ?, phone = ?, email = ?, referral_code = ?, vip_level = ? WHERE id = ?")
                   ->execute([$username, $phone ?: null, $email ?: null, $referralCode ?: null, $vipLevel, $uid]);
                $msg = "Member #$uid profile updated.";
            }
            break;

        case 'add_balance':
            $amount = (float)($_POST['amount'] ?? 0);
            if ($amount <= 0) { $err = 'Enter a positive amount.'; break; }
            $db->prepare("UPDATE users SET balance_pkr = balance_pkr + ? WHERE id = ?")->execute([$amount, $uid]);
            $msg = "Added ₨" . number_format($amount, 2) . " to member #$uid.";
            break;

        case 'deduct_balance':
            $amount = (float)($_POST['amount'] ?? 0);
            if ($amount <= 0) { $err = 'Enter a positive amount.'; break; }
            $db->prepare("UPDATE users SET balance_pkr = GREATEST(0, balance_pkr - ?) WHERE id = ?")->execute([$amount, $uid]);
            $msg = "Deducted ₨" . number_format($amount, 2) . " from member #$uid.";
            break;

        case 'freeze':
            $db->prepare("UPDATE users SET is_frozen = TRUE  WHERE id = ?")->execute([$uid]);
            $msg = "Account #$uid has been frozen.";
            break;

        case 'unfreeze':
            $db->prepare("UPDATE users SET is_frozen = FALSE WHERE id = ?")->execute([$uid]);
            $msg = "Account #$uid has been unfrozen.";
            break;

        case 'delete':
            $db->prepare("DELETE FROM users WHERE id = ?")->execute([$uid]);
            $msg = "Member #$uid permanently deleted.";
            break;
    }
}

// Pagination & search
$perPage = 20;
$page   = max(1, (int)($_GET['page'] ?? 1));
$search = trim($_GET['q'] ?? '');
$offset = ($page - 1) * $perPage;

$conds = []; $params = [];
if ($search) {
    $conds[] = "(username ILIKE ? OR phone ILIKE ? OR referral_code ILIKE ?)";
    $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%";
}
$where = $conds ? "WHERE " . implode(" AND ", $conds) : "";

$totalSt = $db->prepare("SELECT COUNT(*) FROM users $where");
$totalSt->execute($params);
$total = (int)$totalSt->fetchColumn();
$pages = max(1, ceil($total / $perPage));

$st = $db->prepare("
  SELECT u.*,
    (SELECT COUNT(*) FROM users l1 WHERE l1.invited_by = u.id) AS refs_l1,
    (SELECT COUNT(*) FROM users l2 WHERE l2.invited_by IN
       (SELECT l1b.id FROM users l1b WHERE l1b.invited_by = u.id)) AS refs_l2,
    (SELECT COUNT(*) FROM users l3 WHERE l3.invited_by IN
       (SELECT l2b.id FROM users l2b WHERE l2b.invited_by IN
          (SELECT l1c.id FROM users l1c WHERE l1c.invited_by = u.id))) AS refs_l3
  FROM users u $where ORDER BY u.created_at DESC LIMIT $perPage OFFSET $offset
");
$st->execute($params);
$members = $st->fetchAll();

// ── Subordinate list modal (AJAX-style, same page) ───────────────────────────
if (isset($_GET['subs_of'])) {
  $sid  = (int)$_GET['subs_of'];
  $l1   = $db->prepare("SELECT id, username, vip_level, created_at FROM users WHERE invited_by = ? ORDER BY created_at DESC");
  $l1->execute([$sid]); $l1rows = $l1->fetchAll();
  $l1ids = array_column($l1rows, 'id');

  $l2rows = [];
  if ($l1ids) {
    $in2 = implode(',', array_fill(0, count($l1ids), '?'));
    $l2  = $db->prepare("SELECT id, username, vip_level, created_at FROM users WHERE invited_by IN ($in2) ORDER BY created_at DESC");
    $l2->execute($l1ids); $l2rows = $l2->fetchAll();
  }
  $l2ids = array_column($l2rows, 'id');

  $l3rows = [];
  if ($l2ids) {
    $in3 = implode(',', array_fill(0, count($l2ids), '?'));
    $l3  = $db->prepare("SELECT id, username, vip_level, created_at FROM users WHERE invited_by IN ($in3) ORDER BY created_at DESC");
    $l3->execute($l2ids); $l3rows = $l3->fetchAll();
  }

  header('Content-Type: application/json');
  echo json_encode(['l1' => $l1rows, 'l2' => $l2rows, 'l3' => $l3rows]);
  exit;
}

include 'layout_header.php';

$svgEdit   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
$svgTrash  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
$svgLock   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
$svgUnlock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
?>
<div class="page-header">
  <h1>Members</h1>
  <p>View and manage all registered members — <?= number_format($total) ?> total</p>
</div>

<?php if ($msg): ?><div class="alert alert-success"><?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if ($err): ?><div class="alert alert-danger"><?= htmlspecialchars($err) ?></div><?php endif; ?>

<div class="card">
  <div class="card-header">
    <div class="card-title">All Members</div>
    <form method="get" style="display:flex;gap:8px;align-items:center">
      <input type="text" name="q" placeholder="Search username, phone, referral…"
             value="<?= htmlspecialchars($search) ?>"
             style="width:260px;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
      <button type="submit" class="btn btn-primary btn-sm">Search</button>
      <?php if ($search): ?><a href="members.php" class="btn btn-sm btn-outline">Clear</a><?php endif; ?>
    </form>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Referral Code</th>
          <th>Referrals</th>
          <th>Balance PKR</th>
          <th>Wallet</th>
          <th>VIP</th>
          <th>Status</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
      <?php foreach ($members as $m): $frozen = !empty($m['is_frozen']); ?>
      <tr <?= $frozen ? 'style="opacity:.72;background:#faf5ff"' : '' ?>>
        <td><code><?= $m['id'] ?></code></td>
        <td>
          <strong><?= htmlspecialchars($m['username']) ?></strong>
          <?php if ($frozen): ?><br><span class="badge badge-frozen" style="margin-top:3px">Frozen</span><?php endif; ?>
        </td>
        <td><?= htmlspecialchars($m['phone'] ?? '—') ?></td>
        <td><?= htmlspecialchars($m['email'] ?? '—') ?></td>
        <td><code><?= htmlspecialchars($m['referral_code'] ?? '—') ?></code></td>
        <td style="white-space:nowrap">
          <?php
            $l1c = (int)$m['refs_l1'];
            $l2c = (int)$m['refs_l2'];
            $l3c = (int)$m['refs_l3'];
            $tot = $l1c + $l2c + $l3c;
          ?>
          <?php if ($tot > 0): ?>
            <button class="btn btn-sm btn-outline" style="border-color:#6366f1;color:#6366f1;gap:4px;padding:3px 8px"
              onclick="loadSubs(<?= $m['id'] ?>, <?= htmlspecialchars(json_encode($m['username'])) ?>)"
              title="L1: <?= $l1c ?> | L2: <?= $l2c ?> | L3: <?= $l3c ?>">
              👥 <?= $tot ?>
              <span style="font-size:10px;opacity:.7;margin-left:2px">(<?= $l1c ?>+<?= $l2c ?>+<?= $l3c ?>)</span>
            </button>
          <?php else: ?>
            <span style="color:#cbd5e1;font-size:13px">—</span>
          <?php endif; ?>
        </td>
        <td><strong>₨<?= number_format($m['balance_pkr'], 2) ?></strong></td>
        <td>₨<?= number_format($m['wallet_balance'], 2) ?></td>
        <td><span class="badge badge-active">VIP <?= $m['vip_level'] ?></span></td>
        <td>
          <?php if ($frozen): ?>
            <span class="badge badge-frozen">Frozen</span>
          <?php else: ?>
            <span class="badge badge-success">Active</span>
          <?php endif; ?>
        </td>
        <td style="white-space:nowrap"><?= date('d M Y', strtotime($m['created_at'])) ?></td>
        <td style="white-space:nowrap">
          <!-- Edit -->
          <button class="btn btn-primary btn-sm" onclick="openEdit(<?= htmlspecialchars(json_encode($m)) ?>)">
            <?= $svgEdit ?>
          </button>
          <!-- Freeze / Unfreeze -->
          <form method="post" style="display:inline">
            <?= csrfField() ?>
            <input type="hidden" name="user_id" value="<?= $m['id'] ?>">
            <?php if ($frozen): ?>
              <button name="action" value="unfreeze" class="btn btn-sm btn-outline" style="border-color:#6366f1;color:#6366f1" title="Unfreeze account"
                data-confirm="Unfreeze account #<?= $m['id'] ?>?" data-confirm-type="info"><?= $svgUnlock ?></button>
            <?php else: ?>
              <button name="action" value="freeze" class="btn btn-sm btn-outline" style="border-color:#f59e0b;color:#f59e0b" title="Freeze account"
                data-confirm="Freeze account #<?= $m['id'] ?>?" data-confirm-type="warning"><?= $svgLock ?></button>
            <?php endif; ?>
          </form>
          <!-- Delete -->
          <form method="post" style="display:inline" data-confirm="Permanently delete member #<?= $m['id'] ?>? This cannot be undone." data-confirm-type="danger">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="user_id" value="<?= $m['id'] ?>">
            <button type="submit" class="btn btn-danger btn-sm"><?= $svgTrash ?></button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
      <?php if (empty($members)): ?>
      <tr><td colspan="12" style="text-align:center;color:#94a3b8;padding:36px">No members found</td></tr>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
  <?php if ($pages > 1): ?>
  <div class="pagination">
    <span class="page-info">Showing <?= count($members) ?> of <?= $total ?> members</span>
    <?php for ($i = 1; $i <= $pages; $i++): ?>
    <a href="?page=<?= $i ?>&q=<?= urlencode($search) ?>" class="page-link <?= $i === $page ? 'active' : '' ?>"><?= $i ?></a>
    <?php endfor; ?>
  </div>
  <?php endif; ?>
</div>

<!-- ── Edit Member Modal ─────────────────────────────────────────────────── -->
<div class="modal-backdrop" id="editModal">
  <div class="modal" style="max-width:560px">
    <div class="modal-header">
      <div class="modal-title">Edit Member — <span id="em-name"></span></div>
      <button class="modal-close" onclick="closeEdit()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <form method="post" id="editForm">
      <?= csrfField() ?>
      <input type="hidden" name="action" value="edit_member">
      <input type="hidden" name="user_id" id="em-uid">

      <div class="form-grid">
        <div class="form-group">
          <label>Username</label>
          <input type="text" name="username" id="em-username" required>
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="text" name="phone" id="em-phone" placeholder="e.g. +923001234567">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Email Address</label>
          <input type="email" name="email" id="em-email" placeholder="e.g. user@example.com">
        </div>
        <div class="form-group">
          <label>Referral Code</label>
          <input type="text" name="referral_code" id="em-referral">
        </div>
        <div class="form-group">
          <label>VIP Level</label>
          <select name="vip_level" id="em-vip">
            <?php for ($v = 0; $v <= 10; $v++): ?>
            <option value="<?= $v ?>">VIP <?= $v ?></option>
            <?php endfor; ?>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>New Password <span style="font-weight:400;color:#94a3b8;font-size:12px">(leave blank to keep current)</span></label>
          <div style="position:relative">
            <input type="password" name="new_password" id="em-password" placeholder="Enter new password to change…" autocomplete="new-password" style="padding-right:80px">
            <button type="button" onclick="togglePwVis()" id="pw-toggle"
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#6b7280;font-size:12px;cursor:pointer;padding:2px 6px;font-weight:600">
              HIDE
            </button>
          </div>
        </div>
      </div>

      <hr class="divider">

      <!-- Balance adjustment (separate form to avoid conflict) -->
      <div style="background:#f8fafc;border-radius:10px;padding:16px">
        <div style="font-size:12px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Balance Adjustment</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="flex:1;min-width:140px">
            <input type="number" id="bal-amount" min="0" step="0.01" placeholder="Amount (PKR)" style="width:100%">
          </div>
          <button type="button" class="btn btn-success" onclick="submitBalance('add_balance')">+ Add</button>
          <button type="button" class="btn btn-danger"  onclick="submitBalance('deduct_balance')">- Deduct</button>
        </div>
        <div style="margin-top:8px;font-size:12px;color:#94a3b8">
          Current balance: <strong id="em-balance">—</strong>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeEdit()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Profile Changes</button>
      </div>
    </form>
  </div>
</div>

<!-- Hidden balance form -->
<form method="post" id="balanceForm" style="display:none">
  <?= csrfField() ?>
  <input type="hidden" name="action" id="bal-action">
  <input type="hidden" name="user_id" id="bal-uid">
  <input type="hidden" name="amount" id="bal-amt">
</form>

<!-- ── Subordinates Modal ────────────────────────────────────────────────── -->
<div class="modal-backdrop" id="subsModal">
  <div class="modal" style="max-width:640px">
    <div class="modal-header">
      <div class="modal-title">Subordinates — <span id="subs-username"></span></div>
      <button class="modal-close" onclick="closeSubs()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div id="subs-body" style="padding:20px;min-height:120px">
      <div style="text-align:center;color:#94a3b8;padding:40px">Loading…</div>
    </div>
  </div>
</div>

<script>
let _currentMember = null;

function openEdit(m) {
  _currentMember = m;
  document.getElementById('em-uid').value      = m.id;
  document.getElementById('em-name').textContent = m.username;
  document.getElementById('em-username').value = m.username;
  document.getElementById('em-phone').value    = m.phone    || '';
  document.getElementById('em-email').value    = m.email    || '';
  document.getElementById('em-referral').value = m.referral_code || '';
  document.getElementById('em-vip').value      = m.vip_level;
  document.getElementById('em-password').value = '';
  document.getElementById('em-password').type  = 'password';
  document.getElementById('pw-toggle').textContent = 'SHOW';
  document.getElementById('em-balance').textContent = '₨' + parseFloat(m.balance_pkr).toLocaleString('en-PK', {minimumFractionDigits:2, maximumFractionDigits:2});
  document.getElementById('bal-amount').value  = '';
  document.getElementById('editModal').classList.add('open');
}

function closeEdit() { document.getElementById('editModal').classList.remove('open'); }

function togglePwVis() {
  const input = document.getElementById('em-password');
  const btn   = document.getElementById('pw-toggle');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'HIDE';
  } else {
    input.type = 'password';
    btn.textContent = 'SHOW';
  }
}

document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) closeEdit();
});
document.getElementById('subsModal').addEventListener('click', function(e) {
  if (e.target === this) closeSubs();
});

function closeSubs() { document.getElementById('subsModal').classList.remove('open'); }

function loadSubs(uid, username) {
  document.getElementById('subs-username').textContent = username;
  document.getElementById('subs-body').innerHTML = '<div style="text-align:center;color:#94a3b8;padding:40px">Loading…</div>';
  document.getElementById('subsModal').classList.add('open');

  fetch('members.php?subs_of=' + uid)
    .then(r => r.json())
    .then(data => {
      const levels = [
        { label: 'Level 1 — Direct', rows: data.l1, color: '#6366f1' },
        { label: 'Level 2', rows: data.l2, color: '#0ea5e9' },
        { label: 'Level 3', rows: data.l3, color: '#10b981' },
      ];
      let html = '';
      let anyRows = false;
      levels.forEach(lv => {
        if (!lv.rows.length) return;
        anyRows = true;
        html += `<div style="margin-bottom:18px">
          <div style="font-size:12px;font-weight:700;color:${lv.color};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">${lv.label} — ${lv.rows.length} member${lv.rows.length !== 1 ? 's' : ''}</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f8fafc">
              <th style="padding:7px 10px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0">ID</th>
              <th style="padding:7px 10px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0">Username</th>
              <th style="padding:7px 10px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0">VIP</th>
              <th style="padding:7px 10px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0">Joined</th>
            </tr></thead>
            <tbody>`;
        lv.rows.forEach(u => {
          const joined = new Date(u.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
          html += `<tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:7px 10px"><code style="color:#6366f1">${u.id}</code></td>
            <td style="padding:7px 10px;font-weight:600">${escHtml(u.username)}</td>
            <td style="padding:7px 10px"><span style="background:#e0e7ff;color:#4338ca;font-size:11px;font-weight:700;padding:2px 7px;border-radius:20px">VIP ${u.vip_level}</span></td>
            <td style="padding:7px 10px;color:#94a3b8">${joined}</td>
          </tr>`;
        });
        html += '</tbody></table></div>';
      });
      if (!anyRows) html = '<div style="text-align:center;color:#94a3b8;padding:40px">This member has no subordinates yet.</div>';
      document.getElementById('subs-body').innerHTML = html;
    })
    .catch(() => {
      document.getElementById('subs-body').innerHTML = '<div style="text-align:center;color:#ef4444;padding:40px">Failed to load subordinates.</div>';
    });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function submitBalance(action) {
  const amt = parseFloat(document.getElementById('bal-amount').value);
  if (!amt || amt <= 0) { alert('Enter a positive amount.'); return; }
  const uid = document.getElementById('em-uid').value;
  const verb = action === 'add_balance' ? 'Add' : 'Deduct';
  xrtConfirm(verb + ' ₨' + amt.toLocaleString() + ' for member #' + uid + '?', function() {
    document.getElementById('bal-action').value = action;
    document.getElementById('bal-uid').value    = uid;
    document.getElementById('bal-amt').value    = amt;
    document.getElementById('balanceForm').submit();
  }, action === 'add_balance' ? 'success' : 'danger');
}
</script>
<?php include 'layout_footer.php'; ?>
