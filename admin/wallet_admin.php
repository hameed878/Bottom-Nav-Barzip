<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Wallet Management';
$db = getDB();
$msg = $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // ── Wallet Deposit: approve ──────────────────────────────
    if ($action === 'approve_wd') {
        $wdid = (int)($_POST['wd_id'] ?? 0);
        $row  = $db->prepare("SELECT * FROM wallet_deposits WHERE id=?");
        $row->execute([$wdid]); $wd = $row->fetch();
        if ($wd && $wd['status'] === 'pending') {
            $db->beginTransaction();
            try {
                $db->prepare("UPDATE wallet_deposits SET status='completed' WHERE id=?")->execute([$wdid]);
                $db->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?")->execute([$wd['amount_pkr'], $wd['user_id']]);
                $db->commit();
                $msg = "Wallet deposit #{$wdid} approved — ₨" . number_format($wd['amount_pkr'], 2) . " added to wallet.";
            } catch (Exception $e) { $db->rollBack(); $err = $e->getMessage(); }
        }
    }

    // ── Wallet Deposit: reject ───────────────────────────────
    elseif ($action === 'reject_wd') {
        $wdid   = (int)($_POST['wd_id'] ?? 0);
        $reason = trim($_POST['reject_reason'] ?? '');
        $row    = $db->prepare("SELECT * FROM wallet_deposits WHERE id=?");
        $row->execute([$wdid]); $wd = $row->fetch();
        if ($wd && $wd['status'] === 'pending') {
            $db->prepare("UPDATE wallet_deposits SET status='rejected', reject_reason=? WHERE id=?")->execute([$reason, $wdid]);
            $msg = "Wallet deposit #{$wdid} rejected.";
        }
    }

    // ── Wallet Deposit: delete ───────────────────────────────
    elseif ($action === 'delete_wd') {
        $wdid = (int)($_POST['wd_id'] ?? 0);
        $db->prepare("DELETE FROM wallet_deposits WHERE id=?")->execute([$wdid]);
        $msg = "Wallet deposit #{$wdid} deleted.";
    }

    // ── Manual wallet deposit (add record + credit if auto-approve) ──
    elseif ($action === 'manual_wallet_deposit') {
        $uid    = (int)($_POST['user_id'] ?? 0);
        $amount = (float)($_POST['amount'] ?? 0);
        $notes  = trim($_POST['notes'] ?? '');
        $autoApprove = !empty($_POST['auto_approve']);
        if ($uid > 0 && $amount > 0) {
            $status = $autoApprove ? 'completed' : 'pending';
            $db->prepare("INSERT INTO wallet_deposits (user_id,amount_pkr,status,notes) VALUES (?,?,?,?)")->execute([$uid,$amount,$status,$notes]);
            if ($autoApprove) {
                $db->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?")->execute([$amount, $uid]);
                $msg = "₨" . number_format($amount,2) . " credited directly to user #$uid wallet.";
            } else {
                $msg = "Wallet deposit of ₨" . number_format($amount,2) . " created as pending for user #$uid.";
            }
        } else { $err = 'Invalid user ID or amount.'; }
    }

    // ── Adjust wallet balance (direct add/deduct) ────────────
    elseif ($action === 'add_wallet') {
        $uid    = (int)($_POST['user_id'] ?? 0);
        $amount = (float)($_POST['amount'] ?? 0);
        if ($uid > 0 && $amount > 0) {
            $db->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id=?")->execute([$amount, $uid]);
            $msg = "Added ₨" . number_format($amount,2) . " to wallet of user #$uid.";
        } else { $err = 'Invalid user ID or amount.'; }
    }
    elseif ($action === 'deduct_wallet') {
        $uid    = (int)($_POST['user_id'] ?? 0);
        $amount = (float)($_POST['amount'] ?? 0);
        if ($uid > 0 && $amount > 0) {
            $db->prepare("UPDATE users SET wallet_balance = GREATEST(0, wallet_balance - ?) WHERE id=?")->execute([$amount, $uid]);
            $msg = "Deducted ₨" . number_format($amount,2) . " from wallet of user #$uid.";
        } else { $err = 'Invalid user ID or amount.'; }
    }
    elseif ($action === 'set_wallet') {
        $uid    = (int)($_POST['user_id'] ?? 0);
        $amount = (float)($_POST['amount'] ?? 0);
        if ($uid > 0 && $amount >= 0) {
            $db->prepare("UPDATE users SET wallet_balance = ? WHERE id=?")->execute([$amount, $uid]);
            $msg = "Wallet balance of user #$uid set to ₨" . number_format($amount,2) . ".";
        } else { $err = 'Invalid user ID or amount.'; }
    }
}

// ── Stats ────────────────────────────────────────────────────
$stats = $db->query("
    SELECT
        COUNT(*)                                        AS total_deposits,
        COALESCE(SUM(CASE WHEN status='pending'   THEN 1 ELSE 0 END),0) AS pending_count,
        COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END),0) AS approved_count,
        COALESCE(SUM(CASE WHEN status='completed' THEN amount_pkr ELSE 0 END),0) AS total_credited
    FROM wallet_deposits
")->fetch();

$totalWalletBalance = $db->query("SELECT COALESCE(SUM(wallet_balance),0) FROM users")->fetchColumn();

// ── Wallet Deposits list ─────────────────────────────────────
$perPage = 20; $page = max(1,(int)($_GET['page']??1)); $offset=($page-1)*$perPage;
$search  = trim($_GET['q']??''); $statusFilter = trim($_GET['status']??'pending');

$conds=[]; $params=[];
if ($search)       { $conds[]="u.username ILIKE ?"; $params[]="%$search%"; }
if ($statusFilter) { $conds[]="wd.status=?"; $params[]=$statusFilter; }
$where = $conds ? "WHERE ".implode(" AND ",$conds) : "";

$total = (int)$db->prepare("SELECT COUNT(*) FROM wallet_deposits wd JOIN users u ON u.id=wd.user_id $where")->execute($params) ? 
         $db->prepare("SELECT COUNT(*) FROM wallet_deposits wd JOIN users u ON u.id=wd.user_id $where")->execute($params) : 0;

$cntSt = $db->prepare("SELECT COUNT(*) FROM wallet_deposits wd JOIN users u ON u.id=wd.user_id $where");
$cntSt->execute($params); $totalRows = (int)$cntSt->fetchColumn();
$pages = max(1, ceil($totalRows / $perPage));

$dSt = $db->prepare("SELECT wd.*,u.username,u.wallet_balance FROM wallet_deposits wd JOIN users u ON u.id=wd.user_id $where ORDER BY wd.created_at DESC LIMIT $perPage OFFSET $offset");
$dSt->execute($params);
$deposits = $dSt->fetchAll();

// ── Member wallet balances ───────────────────────────────────
$memberSearch = trim($_GET['mq'] ?? '');
$mWhere = $memberSearch ? "WHERE username ILIKE ?" : "";
$mParams = $memberSearch ? ["%$memberSearch%"] : [];
$mSt = $db->prepare("SELECT id, username, balance_pkr, wallet_balance, vip_level FROM users $mWhere ORDER BY wallet_balance DESC LIMIT 50");
$mSt->execute($mParams);
$members = $mSt->fetchAll();

// All users for manual deposit dropdown
$allUsers = $db->query("SELECT id, username FROM users ORDER BY username ASC")->fetchAll();

include 'layout_header.php';
?>
<div class="page-header">
  <h1>Wallet Management</h1>
  <p>Manage user wallet balances and wallet deposit requests</p>
</div>

<?php if($msg): ?><div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if($err): ?><div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($err) ?></div><?php endif; ?>

<!-- Stats -->
<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:22px">
  <div class="stat-card orange">
    <div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div>
    <div class="stat-body"><div class="stat-label">Pending Deposits</div><div class="stat-value"><?= number_format($stats['pending_count']) ?></div></div>
  </div>
  <div class="stat-card green">
    <div class="stat-icon green"><i class="bi bi-check-circle-fill"></i></div>
    <div class="stat-body"><div class="stat-label">Approved</div><div class="stat-value"><?= number_format($stats['approved_count']) ?></div></div>
  </div>
  <div class="stat-card">
    <div class="stat-icon teal"><i class="bi bi-wallet2"></i></div>
    <div class="stat-body"><div class="stat-label">Total Credited</div><div class="stat-value">₨<?= number_format($stats['total_credited'],0) ?></div></div>
  </div>
  <div class="stat-card blue">
    <div class="stat-icon blue"><i class="bi bi-piggy-bank-fill"></i></div>
    <div class="stat-body"><div class="stat-label">All Wallet Balances</div><div class="stat-value">₨<?= number_format($totalWalletBalance,0) ?></div></div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 380px;gap:22px;align-items:start">

  <!-- ── Left: Wallet Deposits ── -->
  <div>
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-wallet-fill"></i> Wallet Deposit Requests</div>
        <form method="get" style="display:flex;gap:8px;align-items:center">
          <input type="text" name="mq" value="<?= htmlspecialchars($_GET['mq']??'') ?>" style="display:none">
          <input type="text" name="q" placeholder="Search username…" value="<?= htmlspecialchars($search) ?>" style="width:160px;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 11px;font-size:13px">
          <select name="status" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 11px;font-size:13px">
            <option value="" <?= $statusFilter===''?'selected':'' ?>>All</option>
            <option value="pending"   <?= $statusFilter==='pending'?'selected':'' ?>>Pending</option>
            <option value="completed" <?= $statusFilter==='completed'?'selected':'' ?>>Approved</option>
            <option value="rejected"  <?= $statusFilter==='rejected'?'selected':'' ?>>Rejected</option>
          </select>
          <button type="submit" class="btn btn-primary btn-sm">Filter</button>
          <a href="wallet_admin.php" class="btn btn-outline btn-sm">Clear</a>
        </form>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>User</th><th>Amount PKR</th><th>Status</th><th>Notes</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
          <?php foreach ($deposits as $d): ?>
          <tr>
            <td><code><?= $d['id'] ?></code></td>
            <td>
              <strong><?= htmlspecialchars($d['username']) ?></strong>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px">Wallet: ₨<?= number_format($d['wallet_balance'],2) ?></div>
            </td>
            <td><strong style="font-size:15px">₨<?= number_format($d['amount_pkr'],2) ?></strong></td>
            <td>
              <?php
              $cls = ['pending'=>'badge-pending','completed'=>'badge-success','rejected'=>'badge-danger'][$d['status']] ?? 'badge-inactive';
              $lbl = ['pending'=>'Pending','completed'=>'Approved','rejected'=>'Rejected'][$d['status']] ?? $d['status'];
              ?>
              <span class="badge <?= $cls ?>"><?= $lbl ?></span>
            </td>
            <td style="font-size:12px;color:#64748b;max-width:130px">
              <?= htmlspecialchars($d['notes'] ?? '') ?: '—' ?>
              <?php if ($d['reject_reason']): ?>
                <div style="color:#e74c3c;font-size:11px;margin-top:2px"><i class="bi bi-x-circle"></i> <?= htmlspecialchars($d['reject_reason']) ?></div>
              <?php endif; ?>
            </td>
            <td style="white-space:nowrap;font-size:12px"><?= date('d M Y H:i', strtotime($d['created_at'])) ?></td>
            <td style="white-space:nowrap">
              <?php if ($d['status'] === 'pending'): ?>
              <form method="post" style="display:inline">
                <input type="hidden" name="action"  value="approve_wd">
                <input type="hidden" name="wd_id"   value="<?= $d['id'] ?>">
                <button type="submit" class="btn btn-success btn-sm" data-confirm="Approve and credit ₨<?= number_format($d['amount_pkr'],2) ?> to wallet?" data-confirm-type="success">
                  <i class="bi bi-check-lg"></i> Approve
                </button>
              </form>
              <button class="btn btn-danger btn-sm" onclick="openRejectWd(<?= $d['id'] ?>)">
                <i class="bi bi-x-lg"></i> Reject
              </button>
              <?php endif; ?>
              <form method="post" style="display:inline" data-confirm="Delete this wallet deposit record?" data-confirm-type="danger">
                <input type="hidden" name="action" value="delete_wd">
                <input type="hidden" name="wd_id"  value="<?= $d['id'] ?>">
                <button type="submit" class="btn btn-sm" style="background:#e2e8f0;color:#4b5563">Del</button>
              </form>
            </td>
          </tr>
          <?php endforeach; ?>
          <?php if (empty($deposits)): ?>
          <tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:36px">
            <?= $statusFilter === 'pending' ? 'No pending wallet deposits' : 'No records found' ?>
          </td></tr>
          <?php endif; ?>
          </tbody>
        </table>
      </div>
      <?php if ($pages > 1): ?>
      <div class="pagination">
        <span class="page-info">Showing <?= count($deposits) ?> of <?= $totalRows ?></span>
        <?php for ($i = 1; $i <= $pages; $i++): ?>
        <a href="?page=<?=$i?>&q=<?=urlencode($search)?>&status=<?=urlencode($statusFilter)?>"
           class="page-link <?= $i===$page?'active':'' ?>"><?= $i ?></a>
        <?php endfor; ?>
      </div>
      <?php endif; ?>
    </div>

    <!-- ── Member Wallet Balances ── -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="bi bi-people-fill"></i> Member Wallet Balances</div>
        <form method="get" style="display:flex;gap:8px">
          <input type="hidden" name="q"      value="<?= htmlspecialchars($search) ?>">
          <input type="hidden" name="status" value="<?= htmlspecialchars($statusFilter) ?>">
          <input type="text"  name="mq" placeholder="Search member…" value="<?= htmlspecialchars($memberSearch) ?>"
                 style="width:200px;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 11px;font-size:13px">
          <button type="submit" class="btn btn-primary btn-sm">Search</button>
          <?php if ($memberSearch): ?><a href="wallet_admin.php" class="btn btn-outline btn-sm">Clear</a><?php endif; ?>
        </form>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Username</th><th>VIP</th><th>Main Balance</th><th>Wallet Balance</th><th>Adjust Wallet</th></tr>
          </thead>
          <tbody>
          <?php foreach ($members as $m): ?>
          <tr>
            <td><code><?= $m['id'] ?></code></td>
            <td><strong><?= htmlspecialchars($m['username']) ?></strong></td>
            <td><span class="badge badge-active">VIP <?= $m['vip_level'] ?></span></td>
            <td>₨<?= number_format($m['balance_pkr'], 2) ?></td>
            <td><strong style="color:#26dad2">₨<?= number_format($m['wallet_balance'], 2) ?></strong></td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="openAdjust(<?= $m['id'] ?>,'<?= addslashes($m['username']) ?>',<?= $m['wallet_balance'] ?>)">
                <i class="bi bi-pencil-fill"></i> Adjust
              </button>
            </td>
          </tr>
          <?php endforeach; ?>
          <?php if (empty($members)): ?>
          <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:28px">No members found</td></tr>
          <?php endif; ?>
          </tbody>
        </table>
      </div>
      <?php if (!$memberSearch): ?>
      <div style="padding:10px 18px;font-size:12px;color:#94a3b8;border-top:1px solid #f0f4f8">
        Showing top 50 by wallet balance. Use search to find a specific member.
      </div>
      <?php endif; ?>
    </div>
  </div>

  <!-- ── Right: Manual Tools ── -->
  <div>

    <!-- Manual Wallet Deposit -->
    <div class="card">
      <div class="card-header"><div class="card-title"><i class="bi bi-plus-circle-fill"></i> Add Wallet Deposit Request</div></div>
      <div class="card-body">
        <form method="post">
          <input type="hidden" name="action" value="manual_wallet_deposit">
          <div class="form-group" style="margin-bottom:14px">
            <label>Member</label>
            <select name="user_id" required style="font-size:13px">
              <option value="">— Select Member —</option>
              <?php foreach ($allUsers as $u): ?>
              <option value="<?= $u['id'] ?>"><?= htmlspecialchars($u['username']) ?> (#<?= $u['id'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:14px">
            <label>Amount (PKR)</label>
            <input type="number" name="amount" min="1" step="0.01" placeholder="e.g. 5000.00" required>
          </div>
          <div class="form-group" style="margin-bottom:14px">
            <label>Notes <span style="font-weight:400;color:#94a3b8;font-size:11px">(optional)</span></label>
            <textarea name="notes" placeholder="e.g. Manual top-up by admin" style="min-height:70px"></textarea>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 12px;background:#f8fafc;border-radius:8px;border:1.5px solid #e2e8f0">
            <input type="checkbox" name="auto_approve" id="auto_approve" value="1" style="width:16px;height:16px;cursor:pointer">
            <label for="auto_approve" style="font-size:13px;font-weight:600;cursor:pointer;text-transform:none;letter-spacing:0;color:#1a2035">
              Auto-approve &amp; credit wallet immediately
            </label>
          </div>
          <button type="submit" class="btn btn-success" style="width:100%;padding:11px;font-size:14px">
            <i class="bi bi-wallet2"></i> Create Deposit Request
          </button>
        </form>
      </div>
    </div>

    <!-- Quick Balance Tips -->
    <div style="background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;margin-bottom:24px">
      <div style="padding:14px 18px;border-bottom:1px solid #f0f2f5">
        <div class="card-title"><i class="bi bi-info-circle-fill" style="color:#26dad2"></i> How Wallet Works</div>
      </div>
      <div style="padding:16px 18px;font-size:13px;color:#4b5563;line-height:1.7">
        <p style="margin-bottom:10px"><strong style="color:#1a2035">Wallet Balance</strong> is separate from the <strong style="color:#1a2035">Main Balance</strong>.</p>
        <ul style="padding-left:18px;display:flex;flex-direction:column;gap:6px">
          <li>Wallet balance is earned via <strong>referral rebates</strong> and can be topped up here.</li>
          <li>Users can <strong>transfer wallet → main balance</strong> themselves from the app.</li>
          <li>Wallet deposits must be <strong>approved by admin</strong> before they credit.</li>
          <li>Main balance deposits are on the <a href="deposits.php" style="color:#26dad2">Deposits</a> page.</li>
        </ul>
      </div>
    </div>

  </div><!-- end right col -->
</div>

<!-- ── Reject Wallet Deposit Modal ── -->
<div class="modal-backdrop" id="rejectWdModal">
  <div class="modal" style="max-width:420px">
    <div class="modal-header">
      <div class="modal-title"><i class="bi bi-x-circle-fill" style="color:#e74c3c"></i> Reject Wallet Deposit</div>
      <button class="modal-close" onclick="closeRejectWd()">✕</button>
    </div>
    <form method="post">
      <input type="hidden" name="action" value="reject_wd">
      <input type="hidden" name="wd_id"  id="rejectWdId">
      <div class="form-group" style="margin-bottom:18px">
        <label>Reason <span style="font-weight:400;color:#94a3b8;font-size:11px">(optional)</span></label>
        <textarea name="reject_reason" placeholder="Reason for rejection…" style="min-height:80px"></textarea>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeRejectWd()">Cancel</button>
        <button type="submit" class="btn btn-danger">Reject Deposit</button>
      </div>
    </form>
  </div>
</div>

<!-- ── Adjust Wallet Balance Modal ── -->
<div class="modal-backdrop" id="adjustModal">
  <div class="modal" style="max-width:440px">
    <div class="modal-header">
      <div class="modal-title"><i class="bi bi-wallet2" style="color:#26dad2"></i> Adjust Wallet — <span id="adj-name"></span></div>
      <button class="modal-close" onclick="closeAdjust()">✕</button>
    </div>
    <div id="adj-current" style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:18px;font-size:13px;color:#4b5563;border:1.5px solid #e2e8f0">
      Current wallet balance: <strong id="adj-bal" style="color:#26dad2;font-size:16px"></strong>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <!-- Add -->
      <form method="post" id="adjAddForm">
        <input type="hidden" name="action" value="add_wallet">
        <input type="hidden" name="user_id" id="adj-uid-add">
        <div style="display:flex;gap:8px;align-items:flex-end">
          <div class="form-group" style="flex:1;margin:0">
            <label style="color:#2ecc71">+ Add to Wallet (PKR)</label>
            <input type="number" name="amount" id="adj-add-amt" min="0.01" step="0.01" placeholder="0.00">
          </div>
          <button type="button" class="btn btn-success" onclick="adjConfirm('add','adjAddForm')">Add</button>
        </div>
      </form>
      <!-- Deduct -->
      <form method="post" id="adjDeductForm">
        <input type="hidden" name="action" value="deduct_wallet">
        <input type="hidden" name="user_id" id="adj-uid-deduct">
        <div style="display:flex;gap:8px;align-items:flex-end">
          <div class="form-group" style="flex:1;margin:0">
            <label style="color:#e74c3c">– Deduct from Wallet (PKR)</label>
            <input type="number" name="amount" id="adj-deduct-amt" min="0.01" step="0.01" placeholder="0.00">
          </div>
          <button type="button" class="btn btn-danger" onclick="adjConfirm('deduct','adjDeductForm')">Deduct</button>
        </div>
      </form>
      <!-- Set exact -->
      <form method="post" id="adjSetForm">
        <input type="hidden" name="action" value="set_wallet">
        <input type="hidden" name="user_id" id="adj-uid-set">
        <div style="display:flex;gap:8px;align-items:flex-end">
          <div class="form-group" style="flex:1;margin:0">
            <label style="color:#3498db">= Set Exact Balance (PKR)</label>
            <input type="number" name="amount" id="adj-set-amt" min="0" step="0.01" placeholder="0.00">
          </div>
          <button type="button" class="btn btn-secondary" onclick="adjConfirm('set','adjSetForm')">Set</button>
        </div>
      </form>
    </div>
    <div class="modal-footer" style="padding-top:14px;margin-top:14px">
      <button type="button" class="btn btn-outline" onclick="closeAdjust()">Close</button>
    </div>
  </div>
</div>

<script>
let _adjName = '', _adjBal = 0, _adjUid = 0;

function openRejectWd(id) {
  document.getElementById('rejectWdId').value = id;
  document.getElementById('rejectWdModal').classList.add('open');
}
function closeRejectWd() { document.getElementById('rejectWdModal').classList.remove('open'); }
document.getElementById('rejectWdModal').addEventListener('click', e => { if (e.target===e.currentTarget) closeRejectWd(); });

function openAdjust(uid, name, bal) {
  _adjUid = uid; _adjName = name; _adjBal = parseFloat(bal) || 0;
  document.getElementById('adj-name').textContent = name;
  document.getElementById('adj-bal').textContent  = '₨' + _adjBal.toLocaleString('en-PK', {minimumFractionDigits:2});
  ['adj-uid-add','adj-uid-deduct','adj-uid-set'].forEach(id => document.getElementById(id).value = uid);
  document.getElementById('adj-add-amt').value    = '';
  document.getElementById('adj-deduct-amt').value = '';
  document.getElementById('adj-set-amt').value    = _adjBal.toFixed(2);
  document.getElementById('adjustModal').classList.add('open');
}
function closeAdjust() { document.getElementById('adjustModal').classList.remove('open'); }
document.getElementById('adjustModal').addEventListener('click', e => { if (e.target===e.currentTarget) closeAdjust(); });

function adjConfirm(type, formId) {
  const msgs = {
    add:    'Add ₨'    + (parseFloat(document.getElementById('adj-add-amt').value)||0).toLocaleString()    + ' to '    + _adjName + '\'s wallet?',
    deduct: 'Deduct ₨' + (parseFloat(document.getElementById('adj-deduct-amt').value)||0).toLocaleString() + ' from ' + _adjName + '\'s wallet?',
    set:    'Set '     + _adjName + '\'s wallet balance to ₨' + (parseFloat(document.getElementById('adj-set-amt').value)||0).toLocaleString() + '?'
  };
  const ctype = type === 'add' ? 'success' : (type === 'deduct' ? 'danger' : 'warning');
  xrtConfirm(msgs[type], function() { document.getElementById(formId).submit(); }, ctype);
}
</script>
<?php include 'layout_footer.php'; ?>
