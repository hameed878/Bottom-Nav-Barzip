<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Matches & Bets';
$db = getDB();

$msg = $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $action = $_POST['action'] ?? '';
    $bid    = (int)($_POST['bet_id'] ?? 0);

    // ── Single bet actions ──────────────────────────────────────────────────
    if ($action === 'settle_win' && $bid > 0) {
        $st = $db->prepare("SELECT * FROM bets WHERE id = ? AND status = 'active'");
        $st->execute([$bid]);
        $bet = $st->fetch();
        if ($bet) {
            $db->prepare("UPDATE bets SET status = 'won' WHERE id = ?")->execute([$bid]);
            $payout = (float)$bet['estimated_profit'] + (float)$bet['stake_pkr'];
            $db->prepare("UPDATE users SET balance_pkr = balance_pkr + ? WHERE id = ?")->execute([$payout, $bet['user_id']]);
            $msg = "Bet #$bid settled as WON — ₨" . number_format($payout, 2) . " paid out.";
        }
    } elseif ($action === 'settle_loss' && $bid > 0) {
        $db->prepare("UPDATE bets SET status = 'lost' WHERE id = ? AND status = 'active'")->execute([$bid]);
        $msg = "Bet #$bid settled as LOST.";

    } elseif ($action === 'delete' && $bid > 0) {
        $db->prepare("DELETE FROM bets WHERE id = ?")->execute([$bid]);
        $msg = "Bet #$bid deleted.";

    // ── Bulk actions (Win All / Lose All for filtered active bets) ──────────
    } elseif (in_array($action, ['bulk_win', 'bulk_lose'])) {
        $bulkMatch = trim($_POST['bulk_match'] ?? '');
        $bulkOdds  = trim($_POST['bulk_odds']  ?? '');

        $conds = ["b.status = 'active'"]; $params = [];
        if ($bulkMatch !== '') { $conds[] = "(b.home_team ILIKE ? OR b.away_team ILIKE ?)"; $params[] = "%$bulkMatch%"; $params[] = "%$bulkMatch%"; }
        if ($bulkOdds  !== '') { $conds[] = "CAST(b.odds_value AS TEXT) LIKE ?";              $params[] = "%$bulkOdds%"; }
        $w = "WHERE " . implode(" AND ", $conds);

        $betsToSettle = $db->prepare("SELECT b.* FROM bets b $w")->execute($params)
            ? (function() use ($db, $w, $params) {
                $s = $db->prepare("SELECT b.* FROM bets b $w");
                $s->execute($params); return $s->fetchAll();
              })()
            : [];
        // Re-fetch properly
        $fetchSt = $db->prepare("SELECT b.* FROM bets b $w");
        $fetchSt->execute($params);
        $betsToSettle = $fetchSt->fetchAll();

        $count = 0;
        $db->beginTransaction();
        try {
            if ($action === 'bulk_win') {
                $stUpd  = $db->prepare("UPDATE bets SET status = 'won'  WHERE id = ? AND status = 'active'");
                $stPay  = $db->prepare("UPDATE users SET balance_pkr = balance_pkr + ? WHERE id = ?");
                foreach ($betsToSettle as $bet) {
                    $stUpd->execute([$bet['id']]);
                    if ($stUpd->rowCount() > 0) {
                        $payout = (float)$bet['estimated_profit'] + (float)$bet['stake_pkr'];
                        $stPay->execute([$payout, $bet['user_id']]);
                        $count++;
                    }
                }
                $msg = "WIN ALL: $count bet(s) settled as WON and payouts credited.";
            } else {
                $stUpd = $db->prepare("UPDATE bets SET status = 'lost' WHERE id = ? AND status = 'active'");
                foreach ($betsToSettle as $bet) {
                    $stUpd->execute([$bet['id']]);
                    if ($stUpd->rowCount() > 0) $count++;
                }
                $msg = "LOSE ALL: $count bet(s) settled as LOST.";
            }
            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            $err = "Settlement failed: " . $e->getMessage();
        }
        if (!$err && $count === 0) $err = "No active bets matched the selected filters.";
    }
}

// ── Filters ─────────────────────────────────────────────────────────────────
$perPage = 25;
$page   = max(1, (int)($_GET['page'] ?? 1));
$search = trim($_GET['q']      ?? '');
$status = trim($_GET['status'] ?? '');
$fOdds  = trim($_GET['odds']   ?? '');
$offset = ($page - 1) * $perPage;

$conds = []; $params = [];
if ($search) { $conds[] = "(b.home_team ILIKE ? OR b.away_team ILIKE ? OR u.username ILIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%"; }
if ($status) { $conds[] = "b.status = ?";  $params[] = $status; }
if ($fOdds)  { $conds[] = "CAST(b.odds_value AS TEXT) LIKE ?"; $params[] = "%$fOdds%"; }
$where = $conds ? "WHERE " . implode(" AND ", $conds) : "";

$totalSt = $db->prepare("SELECT COUNT(*) FROM bets b JOIN users u ON u.id = b.user_id $where");
$totalSt->execute($params);
$total = (int)$totalSt->fetchColumn();
$pages = max(1, ceil($total / $perPage));

$st = $db->prepare("SELECT b.*, u.username FROM bets b JOIN users u ON u.id = b.user_id $where ORDER BY b.created_at DESC LIMIT $perPage OFFSET $offset");
$st->execute($params);
$bets = $st->fetchAll();

// Stats
$statMap = [];
foreach ($db->query("SELECT status, COUNT(*) cnt, COALESCE(SUM(stake_pkr),0) vol FROM bets GROUP BY status")->fetchAll() as $r) {
    $statMap[$r['status']] = $r;
}
$activeCount = (int)($statMap['active']['cnt'] ?? 0);

// Distinct match options for filter
$matches = $db->query("SELECT DISTINCT home_team, away_team FROM bets ORDER BY home_team")->fetchAll();

include 'layout_header.php';

$svgBolt = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
$svgCheck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
$svgX = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
$svgTrash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
?>
<div class="page-header">
  <h1>Matches &amp; Bets</h1>
  <p>Settle match outcomes, apply bulk results, and manage all placed bets — <?= number_format($total) ?> total</p>
</div>

<?php if ($msg): ?><div class="alert alert-success"><?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if ($err): ?><div class="alert alert-danger"><?= htmlspecialchars($err) ?></div><?php endif; ?>

<!-- Stats -->
<div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
  <?php
  $statRows = [
    ['active', 'Active',  'teal',   $svgBolt],
    ['won',    'Won',     'green',  $svgCheck],
    ['lost',   'Lost',    'red',    $svgX],
  ];
  foreach ($statRows as [$key, $label, $col, $icon]): ?>
  <div class="stat-card <?= $col ?>">
    <div class="stat-icon <?= $col ?>"><?= $icon ?></div>
    <div>
      <div class="stat-label"><?= $label ?> Bets</div>
      <div class="stat-value"><?= number_format($statMap[$key]['cnt'] ?? 0) ?></div>
    </div>
  </div>
  <?php endforeach; ?>
  <div class="stat-card blue">
    <div class="stat-icon blue">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    </div>
    <div>
      <div class="stat-label">Total Staked</div>
      <div class="stat-value">₨<?= number_format(array_sum(array_column($statMap, 'vol')), 0) ?></div>
    </div>
  </div>
</div>

<!-- Bulk Action Panel -->
<?php if ($activeCount > 0): ?>
<div class="card" style="border-left: 4px solid var(--warning);">
  <div class="card-header">
    <div class="card-title">Bulk Settlement — <?= number_format($activeCount) ?> Active Bet(s)</div>
    <span style="font-size:12px;color:var(--text-muted)">Filter below to target specific bets, then apply Win All or Lose All</span>
  </div>
  <div class="card-body">
    <form method="post" id="bulkForm" onsubmit="return confirmBulk(event)">
      <?= csrfField() ?>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div class="form-group" style="margin:0;min-width:200px">
          <label>Filter by Team / Match</label>
          <input type="text" name="bulk_match" id="bulk_match" placeholder="e.g. Manchester" value="<?= htmlspecialchars($_POST['bulk_match'] ?? '') ?>">
        </div>
        <div class="form-group" style="margin:0;min-width:140px">
          <label>Filter by Odds</label>
          <input type="text" name="bulk_odds" id="bulk_odds" placeholder="e.g. 1.85" value="<?= htmlspecialchars($_POST['bulk_odds'] ?? '') ?>">
        </div>
        <div style="display:flex;gap:8px">
          <button type="submit" name="action" value="bulk_win" class="btn btn-success">
            <?= $svgCheck ?> Win All
          </button>
          <button type="submit" name="action" value="bulk_lose" class="btn btn-danger">
            <?= $svgX ?> Lose All
          </button>
        </div>
      </div>
      <p style="margin-top:10px;font-size:12px;color:var(--text-muted)">
        Leave filters empty to apply to <strong>all <?= number_format($activeCount) ?> active bets</strong>. Fill a filter to target only matching bets.
      </p>
    </form>
  </div>
</div>
<?php endif; ?>

<!-- Bet List -->
<div class="card">
  <div class="card-header">
    <div class="card-title">All Bets</div>
    <form method="get" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <input type="text" name="q" placeholder="Search team or user…" value="<?= htmlspecialchars($search) ?>" style="width:190px;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
      <input type="text" name="odds" placeholder="Odds filter…" value="<?= htmlspecialchars($fOdds) ?>" style="width:120px;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
      <select name="status" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:13px">
        <option value="">All Statuses</option>
        <option value="active" <?= $status === 'active' ? 'selected' : '' ?>>Active</option>
        <option value="won"    <?= $status === 'won'    ? 'selected' : '' ?>>Won</option>
        <option value="lost"   <?= $status === 'lost'   ? 'selected' : '' ?>>Lost</option>
      </select>
      <button type="submit" class="btn btn-primary btn-sm">Filter</button>
      <?php if ($search || $status || $fOdds): ?>
        <a href="matches.php" class="btn btn-sm btn-outline">Clear</a>
      <?php endif; ?>
    </form>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th><th>User</th><th>Match</th><th>Prediction</th>
          <th>Odds</th><th>Stake (PKR)</th><th>Est. Profit</th>
          <th>Status</th><th>Date</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
      <?php foreach ($bets as $b): ?>
      <tr>
        <td><code><?= $b['id'] ?></code></td>
        <td><strong><?= htmlspecialchars($b['username']) ?></strong></td>
        <td>
          <div style="font-weight:600;font-size:12.5px"><?= htmlspecialchars($b['home_team']) ?> vs <?= htmlspecialchars($b['away_team']) ?></div>
          <div style="color:#94a3b8;font-size:11px"><?= htmlspecialchars($b['league_name'] ?? '') ?> &middot; <?= htmlspecialchars($b['match_date'] ?? '') ?></div>
        </td>
        <td><span class="badge badge-info"><?= htmlspecialchars($b['selected_score']) ?></span></td>
        <td><strong><?= htmlspecialchars($b['odds_value']) ?></strong></td>
        <td>₨<?= number_format($b['stake_pkr'], 2) ?></td>
        <td>₨<?= number_format($b['estimated_profit'], 2) ?></td>
        <td>
          <?php $sc = ['active' => 'badge-active', 'won' => 'badge-success', 'lost' => 'badge-danger'][$b['status']] ?? 'badge-inactive'; ?>
          <span class="badge <?= $sc ?>"><?= ucfirst($b['status']) ?></span>
        </td>
        <td style="white-space:nowrap"><?= date('d M Y', strtotime($b['created_at'])) ?></td>
        <td style="white-space:nowrap">
          <?php if ($b['status'] === 'active'): ?>
          <form method="post" style="display:inline">
            <?= csrfField() ?>
            <input type="hidden" name="bet_id" value="<?= $b['id'] ?>">
            <button name="action" value="settle_win"  class="btn btn-success btn-sm" data-confirm="Settle bet #<?= $b['id'] ?> as WON?" data-confirm-type="success"><?= $svgCheck ?> Won</button>
            <button name="action" value="settle_loss" class="btn btn-danger  btn-sm" data-confirm="Settle bet #<?= $b['id'] ?> as LOST?" data-confirm-type="danger"><?= $svgX ?> Lost</button>
          </form>
          <?php endif; ?>
          <form method="post" style="display:inline" data-confirm="Permanently delete bet #<?= $b['id'] ?>? This cannot be undone." data-confirm-type="danger">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="bet_id" value="<?= $b['id'] ?>">
            <button type="submit" class="btn btn-sm btn-outline"><?= $svgTrash ?></button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
      <?php if (empty($bets)): ?>
        <tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:36px">No bets found for the current filters</td></tr>
      <?php endif; ?>
      </tbody>
    </table>
  </div>
  <?php if ($pages > 1): ?>
  <div class="pagination">
    <span class="page-info">Showing <?= count($bets) ?> of <?= $total ?> bets</span>
    <?php for ($i = 1; $i <= $pages; $i++): ?>
    <a href="?page=<?= $i ?>&q=<?= urlencode($search) ?>&status=<?= urlencode($status) ?>&odds=<?= urlencode($fOdds) ?>"
       class="page-link <?= $i === $page ? 'active' : '' ?>"><?= $i ?></a>
    <?php endfor; ?>
  </div>
  <?php endif; ?>
</div>

<script>
function confirmBulk(e) {
  e.preventDefault();
  const btn    = document.activeElement;
  const form   = btn ? btn.closest('form') : document.getElementById('bulkForm');
  const action = btn?.value === 'bulk_win' ? 'WIN ALL' : 'LOSE ALL';
  const match  = document.getElementById('bulk_match').value.trim();
  const odds   = document.getElementById('bulk_odds').value.trim();
  let scope = 'ALL active bets';
  if (match || odds) scope = 'filtered active bets' + (match ? ' matching "' + match + '"' : '') + (odds ? ' with odds "' + odds + '"' : '');
  xrtConfirm('Apply ' + action + ' to ' + scope + '? This cannot be undone.', function() {
    if (btn && btn.name && btn.value) {
      let inp = form.querySelector('input._xrt_bulk');
      if (!inp) { inp = document.createElement('input'); inp.type='hidden'; inp.className='_xrt_bulk'; inp.name='action'; form.appendChild(inp); }
      inp.value = btn.value;
    }
    form.submit();
  }, 'danger');
}
</script>
<?php include 'layout_footer.php'; ?>
