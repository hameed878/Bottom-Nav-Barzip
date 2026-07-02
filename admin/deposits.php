<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Deposits';

$db = getDB();
$msg = $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $did = (int)($_POST['deposit_id'] ?? 0);

    // Reset any aborted transaction left by a previous failed request
    if ($db->inTransaction()) { try { $db->rollBack(); } catch(Exception $_) {} }

    if ($action === 'approve' && $did > 0) {
        $st = $db->prepare("SELECT * FROM deposits WHERE id=?");
        $st->execute([$did]);
        $dep = $st->fetch();
        if ($dep && $dep['status'] === 'pending') {
            // Credit the right column: wallet recharges go to wallet_balance, main go to balance_pkr
            $depType = $dep['deposit_type'] ?? 'main';
            $balCol  = ($depType === 'wallet') ? 'wallet_balance' : 'balance_pkr';
            $db->beginTransaction();
            try {
                $db->prepare("UPDATE deposits SET status='completed' WHERE id=?")->execute([$did]);
                $db->prepare("UPDATE users SET $balCol = $balCol + ? WHERE id=?")->execute([(float)$dep['amount_pkr'], $dep['user_id']]);
                $db->commit();
                $label = ($depType === 'wallet') ? 'wallet balance' : 'main balance';
                $msg = "Deposit #$did approved. ₨" . number_format($dep['amount_pkr'], 2) . " credited to user's $label.";
            } catch(Exception $e) {
                if ($db->inTransaction()) { try { $db->rollBack(); } catch(Exception $_) {} }
                $err = "Failed: " . $e->getMessage();
            }
        } else {
            $err = "Deposit #$did not found or already processed.";
        }
    } elseif ($action === 'reject' && $did > 0) {
        $db->prepare("UPDATE deposits SET status='rejected' WHERE id=?")->execute([$did]);
        $msg = "Deposit #$did rejected.";
    } elseif ($action === 'delete' && $did > 0) {
        $db->prepare("DELETE FROM deposits WHERE id=?")->execute([$did]);
        $msg = "Deposit #$did deleted.";
    } elseif ($action === 'manual_add') {
        $uid   = (int)($_POST['user_id'] ?? 0);
        $amt   = (float)($_POST['amount'] ?? 0);
        $mtype = $_POST['deposit_type_manual'] ?? 'main';
        $balCol = ($mtype === 'wallet') ? 'wallet_balance' : 'balance_pkr';
        if ($uid > 0 && $amt > 0) {
            $db->beginTransaction();
            try {
                $db->prepare("INSERT INTO deposits (user_id, amount_pkr, status, deposit_type) VALUES (?,?,'completed',?)")->execute([$uid, $amt, $mtype]);
                $db->prepare("UPDATE users SET $balCol = $balCol + ? WHERE id=?")->execute([$amt, $uid]);
                $db->commit();
                $label = ($mtype === 'wallet') ? 'wallet balance' : 'main balance';
                $msg = "Manual deposit of ₨" . number_format($amt,2) . " added for user #$uid ($label).";
            } catch(Exception $e) {
                if ($db->inTransaction()) { try { $db->rollBack(); } catch(Exception $_) {} }
                $err = $e->getMessage();
            }
        }
    }
}

$perPage = 25; $page = max(1,(int)($_GET['page']??1)); $offset = ($page-1)*$perPage;
$search  = trim($_GET['q']??''); $status = trim($_GET['status']??'');

$conds=[]; $params=[];
if($search){ $conds[]="(u.username ILIKE ?)"; $params[]="%$search%"; }
if($status){ $conds[]="d.status=?"; $params[]=$status; }
$where=$conds?"WHERE ".implode(" AND ",$conds):"";

$total=(int)$db->prepare("SELECT COUNT(*) FROM deposits d JOIN users u ON u.id=d.user_id $where")->execute($params) ? (function() use($db,$where,$params){ $s=$db->prepare("SELECT COUNT(*) FROM deposits d JOIN users u ON u.id=d.user_id $where"); $s->execute($params); return (int)$s->fetchColumn(); })() : 0;
$cntSt=$db->prepare("SELECT COUNT(*) FROM deposits d JOIN users u ON u.id=d.user_id $where"); $cntSt->execute($params); $total=(int)$cntSt->fetchColumn();
$pages=max(1,ceil($total/$perPage));

$st=$db->prepare("SELECT d.*,u.username FROM deposits d JOIN users u ON u.id=d.user_id $where ORDER BY d.created_at DESC LIMIT $perPage OFFSET $offset");
$st->execute($params); $deps=$st->fetchAll();

$summary=$db->query("SELECT status, COUNT(*) cnt, COALESCE(SUM(amount_pkr),0) tot FROM deposits GROUP BY status")->fetchAll();
$sumMap=[];foreach($summary as $s){ $sumMap[$s['status']]=$s; }

$users=$db->query("SELECT id,username FROM users ORDER BY username LIMIT 200")->fetchAll();

include 'layout_header.php';
?>
<div class="page-header">
  <h1>Deposits</h1>
  <p>Manage all member deposits — approve, reject, or add manually</p>
</div>

<?php if($msg): ?><div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if($err): ?><div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($err) ?></div><?php endif; ?>

<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:22px">
  <div class="stat-card orange"><div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value"><?= number_format($sumMap['pending']['cnt']??0) ?></div></div></div>
  <div class="stat-card green"><div class="stat-icon green"><i class="bi bi-check-circle-fill"></i></div><div class="stat-body"><div class="stat-label">Completed</div><div class="stat-value"><?= number_format($sumMap['completed']['cnt']??0) ?></div></div></div>
  <div class="stat-card red"><div class="stat-icon red"><i class="bi bi-x-circle-fill"></i></div><div class="stat-body"><div class="stat-label">Rejected</div><div class="stat-value"><?= number_format($sumMap['rejected']['cnt']??0) ?></div></div></div>
  <div class="stat-card"><div class="stat-icon teal"><i class="bi bi-cash-stack"></i></div><div class="stat-body"><div class="stat-label">Total Completed</div><div class="stat-value">₨<?= number_format($sumMap['completed']['tot']??0,0) ?></div></div></div>
</div>

<!-- Manual Add -->
<div class="card" style="margin-bottom:22px">
  <div class="card-header"><div class="card-title"><i class="bi bi-plus-circle-fill"></i> Add Manual Deposit</div></div>
  <div class="card-body">
    <form method="post" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
      <input type="hidden" name="action" value="manual_add">
      <div class="form-group" style="flex:2;min-width:160px;margin:0">
        <label>Member</label>
        <select name="user_id" required>
          <option value="">— Select member —</option>
          <?php foreach($users as $u): ?><option value="<?=$u['id']?>">#<?=$u['id']?> <?= htmlspecialchars($u['username']) ?></option><?php endforeach; ?>
        </select>
      </div>
      <div class="form-group" style="flex:1;min-width:120px;margin:0">
        <label>Amount (PKR)</label>
        <input type="number" name="amount" min="1" step="0.01" placeholder="0.00" required>
      </div>
      <div class="form-group" style="flex:1;min-width:130px;margin:0">
        <label>Credit To</label>
        <select name="deposit_type_manual">
          <option value="main">Main Balance</option>
          <option value="wallet">Wallet Balance</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary">Add Deposit</button>
    </form>
  </div>
</div>

<div class="card">
  <div class="card-header">
    <div class="card-title"><i class="bi bi-cash-stack"></i> All Deposits</div>
    <form method="get" style="display:flex;gap:8px">
      <input type="text" name="q" placeholder="Search username…" value="<?= htmlspecialchars($search) ?>" style="width:180px;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
      <select name="status" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
        <option value="">All</option>
        <option value="pending"   <?=$status==='pending'  ?'selected':''?>>Pending</option>
        <option value="completed" <?=$status==='completed'?'selected':''?>>Completed</option>
        <option value="rejected"  <?=$status==='rejected' ?'selected':''?>>Rejected</option>
      </select>
      <button type="submit" class="btn btn-primary btn-sm">Filter</button>
      <?php if($search||$status): ?><a href="deposits.php" class="btn btn-sm btn-outline">Clear</a><?php endif; ?>
    </form>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>#</th><th>User</th><th>Amount (PKR)</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
      <?php foreach($deps as $d): ?>
      <?php $depType = $d['deposit_type'] ?? 'main'; ?>
      <tr>
        <td><code><?=$d['id']?></code></td>
        <td><strong><?= htmlspecialchars($d['username']) ?></strong></td>
        <td><strong>₨<?= number_format($d['amount_pkr'],2) ?></strong></td>
        <td>
          <?php if($depType === 'wallet'): ?>
            <span class="badge" style="background:#fef3c7;color:#92400e;border:1px solid #f59e0b">🪙 Wallet</span>
          <?php else: ?>
            <span class="badge" style="background:#eff6ff;color:#1e40af;border:1px solid #3b82f6">💰 Main</span>
          <?php endif; ?>
        </td>
        <td>
          <?php $cls=['pending'=>'badge-pending','completed'=>'badge-success','rejected'=>'badge-danger'][$d['status']]??'badge-inactive'; ?>
          <span class="badge <?=$cls?>"><?= ucfirst($d['status']) ?></span>
        </td>
        <td><?= date('d M Y H:i', strtotime($d['created_at'])) ?></td>
        <td>
          <?php if($d['status']==='pending'): ?>
          <form method="post" style="display:inline">
            <input type="hidden" name="deposit_id" value="<?=$d['id']?>">
            <?php $approveLabel = ($depType === 'wallet') ? 'Approve → Wallet' : 'Approve → Main'; ?>
            <button name="action" value="approve" class="btn btn-success btn-sm" data-confirm="Approve and credit user's <?= $depType === 'wallet' ? 'wallet balance' : 'main balance' ?>?" data-confirm-type="success"><i class="bi bi-check-lg"></i> <?= $approveLabel ?></button>
            <button name="action" value="reject"  class="btn btn-danger btn-sm"  data-confirm="Reject this deposit?" data-confirm-type="danger"><i class="bi bi-x-lg"></i> Reject</button>
          </form>
          <?php endif; ?>
          <form method="post" style="display:inline" data-confirm="Delete this deposit record? This cannot be undone." data-confirm-type="danger">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="deposit_id" value="<?=$d['id']?>">
            <button type="submit" class="btn btn-sm" style="background:#e2e8f0;color:#4b5563">Del</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
      <?php if(empty($deps)): ?><tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:32px">No deposits found</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
  <?php if($pages>1): ?>
  <div class="pagination">
    <span class="page-info">Showing <?= count($deps) ?> of <?= $total ?></span>
    <?php for($i=1;$i<=$pages;$i++): ?><a href="?page=<?=$i?>&q=<?=urlencode($search)?>&status=<?=urlencode($status)?>" class="page-link <?=$i==$page?'active':''?>"><?=$i?></a><?php endfor; ?>
  </div>
  <?php endif; ?>
</div>
<?php include 'layout_footer.php'; ?>
