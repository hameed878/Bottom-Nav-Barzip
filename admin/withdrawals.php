<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Withdrawals';

$db = getDB();
$msg = $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $wid = (int)($_POST['withdrawal_id'] ?? 0);

    if ($action === 'approve' && $wid > 0) {
        $st = $db->prepare("SELECT * FROM withdrawals WHERE id=?");
        $st->execute([$wid]); $w = $st->fetch();
        if ($w && $w['status'] === 'pending') {
            $db->prepare("UPDATE withdrawals SET status='success' WHERE id=?")->execute([$wid]);
            $msg = "Withdrawal #$wid approved as PAID.";
        }
    } elseif ($action === 'reject' && $wid > 0) {
        $reason = trim($_POST['reject_reason'] ?? '');
        $st = $db->prepare("SELECT * FROM withdrawals WHERE id=?");
        $st->execute([$wid]); $w = $st->fetch();
        if ($w && $w['status'] === 'pending') {
            $db->beginTransaction();
            try {
                $db->prepare("UPDATE withdrawals SET status='rejected', reject_reason=? WHERE id=?")->execute([$reason, $wid]);
                // Refund the amount back to user balance
                $db->prepare("UPDATE users SET balance_pkr = balance_pkr + ? WHERE id=?")->execute([$w['amount_pkr'], $w['user_id']]);
                $db->commit();
                $msg = "Withdrawal #$wid rejected. ₨" . number_format($w['amount_pkr'],2) . " refunded to user.";
            } catch(Exception $e) { $db->rollBack(); $err = $e->getMessage(); }
        }
    } elseif ($action === 'delete' && $wid > 0) {
        $db->prepare("DELETE FROM withdrawals WHERE id=?")->execute([$wid]);
        $msg = "Withdrawal #$wid deleted.";
    }
}

$perPage = 25; $page = max(1,(int)($_GET['page']??1)); $offset = ($page-1)*$perPage;
$search  = trim($_GET['q']??''); $status = trim($_GET['status']??'');

$conds=[]; $params=[];
if($search){ $conds[]="(u.username ILIKE ? OR w.wallet_address ILIKE ?)"; $params[]="%$search%"; $params[]="%$search%"; }
if($status){ $conds[]="w.status=?"; $params[]=$status; }
$where=$conds?"WHERE ".implode(" AND ",$conds):"";

$cntSt=$db->prepare("SELECT COUNT(*) FROM withdrawals w JOIN users u ON u.id=w.user_id $where"); $cntSt->execute($params); $total=(int)$cntSt->fetchColumn();
$pages=max(1,ceil($total/$perPage));

$st=$db->prepare("SELECT w.*,u.username FROM withdrawals w JOIN users u ON u.id=w.user_id $where ORDER BY w.created_at DESC LIMIT $perPage OFFSET $offset");
$st->execute($params); $withs=$st->fetchAll();

$summary=$db->query("SELECT status, COUNT(*) cnt, COALESCE(SUM(amount_pkr),0) tot FROM withdrawals GROUP BY status")->fetchAll();
$sumMap=[]; foreach($summary as $s){ $sumMap[$s['status']]=$s; }

include 'layout_header.php';
?>
<div class="page-header">
  <h1>Withdrawals</h1>
  <p>Review and process member withdrawal requests</p>
</div>

<?php if($msg): ?><div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if($err): ?><div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($err) ?></div><?php endif; ?>

<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:22px">
  <div class="stat-card orange"><div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value"><?= number_format($sumMap['pending']['cnt']??0) ?></div></div></div>
  <div class="stat-card green"><div class="stat-icon green"><i class="bi bi-check-circle-fill"></i></div><div class="stat-body"><div class="stat-label">Paid</div><div class="stat-value"><?= number_format($sumMap['success']['cnt']??0) ?></div></div></div>
  <div class="stat-card red"><div class="stat-icon red"><i class="bi bi-x-circle-fill"></i></div><div class="stat-body"><div class="stat-label">Rejected</div><div class="stat-value"><?= number_format($sumMap['rejected']['cnt']??0) ?></div></div></div>
  <div class="stat-card"><div class="stat-icon teal"><i class="bi bi-wallet2"></i></div><div class="stat-body"><div class="stat-label">Total Paid</div><div class="stat-value">₨<?= number_format($sumMap['success']['tot']??0,0) ?></div></div></div>
</div>

<div class="card">
  <div class="card-header">
    <div class="card-title"><i class="bi bi-arrow-down-circle-fill"></i> All Withdrawals</div>
    <form method="get" style="display:flex;gap:8px">
      <input type="text" name="q" placeholder="Search user or wallet…" value="<?= htmlspecialchars($search) ?>" style="width:200px;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
      <select name="status" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
        <option value="">All</option>
        <option value="pending" <?=$status==='pending'?'selected':''?>>Pending</option>
        <option value="success" <?=$status==='success'?'selected':''?>>Paid</option>
        <option value="rejected"<?=$status==='rejected'?'selected':''?>>Rejected</option>
      </select>
      <button type="submit" class="btn btn-primary btn-sm">Filter</button>
      <?php if($search||$status): ?><a href="withdrawals.php" class="btn btn-sm btn-outline">Clear</a><?php endif; ?>
    </form>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>#</th><th>User</th><th>Amount PKR</th><th>Fee</th><th>USDT</th><th>Wallet</th><th>Status</th><th>Reason</th><th>Date</th><th>Actions</th></tr>
      </thead>
      <tbody>
      <?php foreach($withs as $w): ?>
      <tr>
        <td><code><?=$w['id']?></code></td>
        <td><strong><?= htmlspecialchars($w['username']) ?></strong></td>
        <td><strong>₨<?= number_format($w['amount_pkr'],2) ?></strong></td>
        <td>₨<?= number_format($w['fee_pkr'],2) ?></td>
        <td><?= number_format($w['amount_usdt'],4) ?> USDT</td>
        <td style="font-size:11px;max-width:140px;word-break:break-all"><?= htmlspecialchars($w['wallet_address']) ?></td>
        <td>
          <?php $cls=['pending'=>'badge-pending','success'=>'badge-success','rejected'=>'badge-danger'][$w['status']]??'badge-inactive'; ?>
          <span class="badge <?=$cls?>"><?= ucfirst($w['status']==='success'?'Paid':$w['status']) ?></span>
        </td>
        <td style="font-size:12px;color:#64748b"><?= htmlspecialchars($w['reject_reason']??'—') ?></td>
        <td><?= date('d M Y H:i', strtotime($w['created_at'])) ?></td>
        <td>
          <?php if($w['status']==='pending'): ?>
          <form method="post" style="display:inline">
            <input type="hidden" name="withdrawal_id" value="<?=$w['id']?>">
            <button name="action" value="approve" class="btn btn-success btn-sm" data-confirm="Mark this withdrawal as paid?" data-confirm-type="success"><i class="bi bi-check-lg"></i> Paid</button>
          </form>
          <button class="btn btn-danger btn-sm" onclick="openReject(<?=$w['id']?>)"><i class="bi bi-x-lg"></i> Reject</button>
          <?php endif; ?>
          <form method="post" style="display:inline" data-confirm="Delete this withdrawal record? This cannot be undone." data-confirm-type="danger">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="withdrawal_id" value="<?=$w['id']?>">
            <button type="submit" class="btn btn-sm" style="background:#e2e8f0;color:#4b5563">Del</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
      <?php if(empty($withs)): ?><tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:32px">No withdrawals found</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
  <?php if($pages>1): ?>
  <div class="pagination">
    <span class="page-info">Showing <?= count($withs) ?> of <?= $total ?></span>
    <?php for($i=1;$i<=$pages;$i++): ?><a href="?page=<?=$i?>&q=<?=urlencode($search)?>&status=<?=urlencode($status)?>" class="page-link <?=$i==$page?'active':''?>"><?=$i?></a><?php endfor; ?>
  </div>
  <?php endif; ?>
</div>

<!-- Reject Modal -->
<div class="modal-backdrop" id="rejectModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title"><i class="bi bi-x-circle-fill"></i> Reject Withdrawal</div>
      <button class="modal-close" onclick="closeReject()">✕</button>
    </div>
    <form method="post">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="withdrawal_id" id="reject-wid">
      <div class="form-group">
        <label>Reason for Rejection <span style="font-weight:400;color:#94a3b8;font-size:11px">(optional)</span></label>
        <textarea name="reject_reason" placeholder="Enter rejection reason… (optional)"></textarea>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeReject()">Cancel</button>
        <button type="submit" class="btn btn-danger">Reject & Refund</button>
      </div>
    </form>
  </div>
</div>
<script>
function openReject(id) { document.getElementById('reject-wid').value=id; document.getElementById('rejectModal').classList.add('open'); }
function closeReject() { document.getElementById('rejectModal').classList.remove('open'); }
document.getElementById('rejectModal').addEventListener('click',e=>{ if(e.target===e.currentTarget)closeReject(); });
</script>
<?php include 'layout_footer.php'; ?>
