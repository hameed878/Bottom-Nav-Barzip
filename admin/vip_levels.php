<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'VIP Levels';

$db = getDB();
$msg = '';

// VIP config stored in admin_settings
$vipConfig = [
    0  => ['name'=>'Standard',    'min_trade'=>0,       'daily_rate'=>0,    'color'=>'#94a3b8'],
    1  => ['name'=>'Bronze',      'min_trade'=>500,     'daily_rate'=>0.10, 'color'=>'#cd7f32'],
    2  => ['name'=>'Silver',      'min_trade'=>5000,    'daily_rate'=>0.15, 'color'=>'#c0c0c0'],
    3  => ['name'=>'Gold',        'min_trade'=>20000,   'daily_rate'=>0.20, 'color'=>'#ffd700'],
    4  => ['name'=>'Platinum',    'min_trade'=>50000,   'daily_rate'=>0.25, 'color'=>'#e5e4e2'],
    5  => ['name'=>'Diamond',     'min_trade'=>100000,  'daily_rate'=>0.30, 'color'=>'#b9f2ff'],
    6  => ['name'=>'Master',      'min_trade'=>300000,  'daily_rate'=>0.35, 'color'=>'#9b59b6'],
    7  => ['name'=>'Grandmaster', 'min_trade'=>600000,  'daily_rate'=>0.40, 'color'=>'#e74c3c'],
    8  => ['name'=>'Legend',      'min_trade'=>1000000, 'daily_rate'=>0.45, 'color'=>'#f39c12'],
    9  => ['name'=>'Elite',       'min_trade'=>2000000, 'daily_rate'=>0.50, 'color'=>'#2ecc71'],
    10 => ['name'=>'Supreme',     'min_trade'=>5000000, 'daily_rate'=>0.60, 'color'=>'#26dad2'],
];

// Member counts per VIP level
$vipCounts = $db->query("SELECT vip_level, COUNT(*) cnt FROM users GROUP BY vip_level")->fetchAll(PDO::FETCH_KEY_PAIR);
$vipCountMap = [];
foreach ($db->query("SELECT vip_level, COUNT(*) cnt FROM users GROUP BY vip_level")->fetchAll() as $r) {
    $vipCountMap[$r['vip_level']] = $r['cnt'];
}

// Recent VIP rewards
$recentRewards = $db->query("
    SELECT vr.*, u.username
    FROM vip_rewards vr
    JOIN users u ON u.id = vr.user_id
    ORDER BY vr.created_at DESC
    LIMIT 20
")->fetchAll();

// Total VIP rewards paid
$totalRewardsPaid = $db->query("SELECT COALESCE(SUM(reward_amount),0) FROM vip_rewards")->fetchColumn();

include 'layout_header.php';
?>
<div class="page-header">
  <h1>VIP Levels</h1>
  <p>Overview of VIP tier structure and member distribution</p>
</div>

<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:22px">
  <div class="stat-card"><div class="stat-icon teal"><i class="bi bi-award-fill"></i></div><div class="stat-body"><div class="stat-label">Total VIP Members</div><div class="stat-value"><?= number_format(array_sum($vipCountMap)) ?></div></div></div>
  <div class="stat-card green"><div class="stat-icon green"><i class="bi bi-gem"></i></div><div class="stat-body"><div class="stat-label">VIP 5+ Members</div><div class="stat-value"><?= number_format(array_sum(array_filter($vipCountMap, fn($k)=>$k>=5, ARRAY_FILTER_USE_KEY))) ?></div></div></div>
  <div class="stat-card orange"><div class="stat-icon orange"><i class="bi bi-gift-fill"></i></div><div class="stat-body"><div class="stat-label">Total Rewards Paid</div><div class="stat-value">₨<?= number_format($totalRewardsPaid,0) ?></div></div></div>
</div>

<!-- VIP Tier Table -->
<div class="card" style="margin-bottom:22px">
  <div class="card-header"><div class="card-title"><i class="bi bi-award-fill"></i> VIP Tier Structure</div></div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Level</th><th>Tier Name</th><th>Min Trade Volume (PKR)</th><th>Daily Reward Rate</th><th>Members</th><th>Upgrade Members</th></tr></thead>
      <tbody>
      <?php foreach($vipConfig as $lvl=>$cfg): ?>
      <tr>
        <td>
          <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:<?= $cfg['color'] ?>22;color:<?= $cfg['color'] ?>;font-weight:700;font-size:14px"><?=$lvl?></span>
        </td>
        <td>
          <strong style="color:<?= $cfg['color'] ?>"><?= $cfg['name'] ?></strong>
        </td>
        <td>₨<?= number_format($cfg['min_trade']) ?></td>
        <td><span class="badge badge-active"><?= $cfg['daily_rate'] ?>%</span></td>
        <td>
          <span class="badge <?= ($vipCountMap[$lvl]??0)>0?'badge-success':'badge-inactive' ?>">
            <?= number_format($vipCountMap[$lvl]??0) ?> members
          </span>
        </td>
        <td>
          <a href="members.php" class="btn btn-outline btn-sm">View Members</a>
        </td>
      </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Recent Rewards -->
<div class="card">
  <div class="card-header"><div class="card-title"><i class="bi bi-gift-fill"></i> Recent VIP Rewards</div></div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>#</th><th>Member</th><th>VIP Level</th><th>Balance Snapshot</th><th>Rate</th><th>Reward Amount</th><th>For Date</th><th>Created</th></tr></thead>
      <tbody>
      <?php foreach($recentRewards as $r): ?>
      <tr>
        <td><code><?=$r['id']?></code></td>
        <td><strong><?= htmlspecialchars($r['username']) ?></strong></td>
        <td><span class="badge badge-active">VIP <?=$r['vip_level']?></span></td>
        <td>₨<?= number_format($r['balance_snapshot'],2) ?></td>
        <td><?= number_format($r['reward_rate']*100,2) ?>%</td>
        <td><strong style="color:#1a8a3d">+₨<?= number_format($r['reward_amount'],2) ?></strong></td>
        <td><?= $r['rewarded_for'] ?></td>
        <td><?= date('d M Y', strtotime($r['created_at'])) ?></td>
      </tr>
      <?php endforeach; ?>
      <?php if(empty($recentRewards)): ?><tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:32px">No VIP rewards issued yet</td></tr><?php endif; ?>
      </tbody>
    </table>
  </div>
</div>
<?php include 'layout_footer.php'; ?>
