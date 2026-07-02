<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Dashboard';

$db = getDB();

// Stats
$totalMembers   = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
$totalDeposits  = $db->query("SELECT COALESCE(SUM(amount_pkr),0) FROM deposits WHERE status='completed'")->fetchColumn();
$totalWithdrawals = $db->query("SELECT COALESCE(SUM(amount_pkr),0) FROM withdrawals WHERE status='success'")->fetchColumn();
$totalBets      = $db->query("SELECT COUNT(*) FROM bets")->fetchColumn();
$pendingDep     = $db->query("SELECT COUNT(*) FROM deposits WHERE status='pending'")->fetchColumn();
$pendingWith    = $db->query("SELECT COUNT(*) FROM withdrawals WHERE status='pending'")->fetchColumn();
$activeBets     = $db->query("SELECT COUNT(*) FROM bets WHERE status='active'")->fetchColumn();
$usdtPrice      = setting('usdt_price', '280');

// Recent members
$recentMembers = $db->query("SELECT id, username, balance_pkr, vip_level, created_at FROM users ORDER BY created_at DESC LIMIT 5")->fetchAll();

// Recent deposits
$recentDeposits = $db->query("
    SELECT d.id, u.username, d.amount_pkr, d.status, d.created_at
    FROM deposits d JOIN users u ON u.id=d.user_id
    ORDER BY d.created_at DESC LIMIT 5
")->fetchAll();

include 'layout_header.php';
?>
<div class="page-header">
  <h1>Dashboard Overview</h1>
  <p>Welcome back, Admin! Here's what's happening today.</p>
</div>

<!-- STATS -->
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon teal"><i class="bi bi-people-fill"></i></div>
    <div class="stat-body">
      <div class="stat-label">Total Members</div>
      <div class="stat-value"><?= number_format($totalMembers) ?></div>
    </div>
  </div>
  <div class="stat-card green">
    <div class="stat-icon green"><i class="bi bi-cash-stack"></i></div>
    <div class="stat-body">
      <div class="stat-label">Total Deposits</div>
      <div class="stat-value">₨<?= number_format($totalDeposits, 0) ?></div>
    </div>
  </div>
  <div class="stat-card orange">
    <div class="stat-icon orange"><i class="bi bi-send-fill"></i></div>
    <div class="stat-body">
      <div class="stat-label">Total Withdrawals</div>
      <div class="stat-value">₨<?= number_format($totalWithdrawals, 0) ?></div>
    </div>
  </div>
  <div class="stat-card blue">
    <div class="stat-icon blue"><i class="bi bi-trophy-fill"></i></div>
    <div class="stat-body">
      <div class="stat-label">Total Bets</div>
      <div class="stat-value"><?= number_format($totalBets) ?></div>
    </div>
  </div>
  <div class="stat-card orange">
    <div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div>
    <div class="stat-body">
      <div class="stat-label">Pending Deposits</div>
      <div class="stat-value"><?= number_format($pendingDep) ?></div>
    </div>
  </div>
  <div class="stat-card red">
    <div class="stat-icon red"><i class="bi bi-hourglass-split"></i></div>
    <div class="stat-body">
      <div class="stat-label">Pending Withdrawals</div>
      <div class="stat-value"><?= number_format($pendingWith) ?></div>
    </div>
  </div>
  <div class="stat-card">
    <div class="stat-icon teal"><i class="bi bi-bullseye"></i></div>
    <div class="stat-body">
      <div class="stat-label">Active Bets</div>
      <div class="stat-value"><?= number_format($activeBets) ?></div>
    </div>
  </div>
  <div class="stat-card green">
    <div class="stat-icon green"><i class="bi bi-currency-exchange"></i></div>
    <div class="stat-body">
      <div class="stat-label">USDT Price (PKR)</div>
      <div class="stat-value">₨<?= number_format($usdtPrice, 2) ?></div>
    </div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;">
  <!-- Recent Members -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="bi bi-people-fill"></i> Recent Members</div>
      <a href="members.php" class="btn btn-outline btn-sm">View All</a>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Username</th><th>Balance</th><th>VIP</th><th>Joined</th></tr></thead>
        <tbody>
        <?php foreach($recentMembers as $m): ?>
        <tr>
          <td><?= $m['id'] ?></td>
          <td><strong><?= htmlspecialchars($m['username']) ?></strong></td>
          <td>₨<?= number_format($m['balance_pkr'], 2) ?></td>
          <td><span class="badge badge-active">VIP <?= $m['vip_level'] ?></span></td>
          <td><?= date('d M', strtotime($m['created_at'])) ?></td>
        </tr>
        <?php endforeach; ?>
        <?php if(empty($recentMembers)): ?><tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">No members yet</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Recent Deposits -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="bi bi-cash-stack"></i> Recent Deposits</div>
      <a href="deposits.php" class="btn btn-outline btn-sm">View All</a>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
        <?php foreach($recentDeposits as $d): ?>
        <tr>
          <td><?= $d['id'] ?></td>
          <td><?= htmlspecialchars($d['username']) ?></td>
          <td>₨<?= number_format($d['amount_pkr'], 2) ?></td>
          <td>
            <?php $s=$d['status'];
            $cls = $s==='completed'?'badge-success':($s==='pending'?'badge-pending':'badge-danger'); ?>
            <span class="badge <?= $cls ?>"><?= ucfirst($s) ?></span>
          </td>
          <td><?= date('d M', strtotime($d['created_at'])) ?></td>
        </tr>
        <?php endforeach; ?>
        <?php if(empty($recentDeposits)): ?><tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px;">No deposits yet</td></tr><?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php include 'layout_footer.php'; ?>
