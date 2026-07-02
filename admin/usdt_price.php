<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'USDT Price';

$db = getDB();
$msg = $err = '';

function fetchLiveUsdtRate($db) {
    $url = 'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=pkr';
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'user_agent' => 'XRT-Admin/1.0']]);
    $resp = @file_get_contents($url, false, $ctx);
    if ($resp) {
        $data = json_decode($resp, true);
        $rate = $data['tether']['pkr'] ?? null;
        if ($rate && $rate > 0) {
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('usdt_price',?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")->execute([$rate]);
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('usdt_last_fetch',?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")->execute([date('Y-m-d H:i:s')]);
            return (float)$rate;
        }
    }
    return null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'update_price') {
        $price = (float)($_POST['usdt_price'] ?? 0);
        if ($price > 0) {
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('usdt_price',?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")->execute([$price]);
            $msg = "USDT price manually set to ₨" . number_format($price, 2);
        } else { $err = "Price must be greater than 0."; }
    } elseif ($action === 'fetch_live') {
        $fetched = fetchLiveUsdtRate($db);
        if ($fetched) {
            $msg = "Live rate fetched: ₨" . number_format($fetched, 2) . " per USDT (via CoinGecko)";
        } else {
            $err = "Could not fetch live rate. Check internet connection or try again.";
        }
    }
}

// Auto-fetch if last fetch > 12 hours ago
$lastFetch = setting('usdt_last_fetch', '');
if ($lastFetch === '' || (time() - strtotime($lastFetch)) > 43200) {
    $autoFetched = fetchLiveUsdtRate($db);
    if ($autoFetched && !$msg) {
        // Silent auto-fetch — no message shown unless it's first time
        if ($lastFetch === '') $msg = "Auto-fetched initial live rate: ₨" . number_format($autoFetched, 2);
    }
}

$currentPrice = (float)setting('usdt_price', '280');
$lastFetch    = setting('usdt_last_fetch', '');

$totalWithdrawalsUsdt = $db->query("SELECT COALESCE(SUM(amount_usdt),0) FROM withdrawals WHERE status='success'")->fetchColumn();
$totalWithdrawalsPkr  = $db->query("SELECT COALESCE(SUM(amount_pkr),0) FROM withdrawals WHERE status='success'")->fetchColumn();
$pendingUsdt          = $db->query("SELECT COALESCE(SUM(amount_usdt),0) FROM withdrawals WHERE status='pending'")->fetchColumn();
$pendingPkr           = $db->query("SELECT COALESCE(SUM(amount_pkr),0) FROM withdrawals WHERE status='pending'")->fetchColumn();

$recent = $db->query("
    SELECT w.amount_pkr, w.amount_usdt, w.fee_pkr, w.status, w.created_at, u.username
    FROM withdrawals w JOIN users u ON u.id=w.user_id
    ORDER BY w.created_at DESC LIMIT 15
")->fetchAll();

include 'layout_header.php';
?>
<div class="page-header">
  <h1>USDT Price</h1>
  <p>Control the PKR → USDT exchange rate used for all withdrawal calculations</p>
</div>

<?php if($msg): ?><div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if($err): ?><div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($err) ?></div><?php endif; ?>

<div style="display:grid;grid-template-columns:400px 1fr;gap:22px;align-items:start">

  <!-- Price Control -->
  <div>
    <div class="card">
      <div class="card-header"><div class="card-title"><i class="bi bi-currency-exchange"></i> USDT Exchange Rate</div></div>
      <div class="card-body">
        <div style="text-align:center;padding:16px 0 20px">
          <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.8px">Current Rate</div>
          <div style="font-size:48px;font-weight:800;color:#1a2035;line-height:1">₨<?= number_format($currentPrice,2) ?></div>
          <div style="color:#26dad2;font-size:13px;margin-top:6px;font-weight:600">per 1 USDT</div>
          <?php if($lastFetch): ?>
          <div style="color:#94a3b8;font-size:11px;margin-top:8px">
            <i class="bi bi-clock"></i> Last fetched: <?= date('d M Y H:i', strtotime($lastFetch)) ?>
            <span style="background:rgba(38,218,210,.1);color:#26dad2;border-radius:4px;padding:1px 6px;margin-left:4px;font-size:10px;font-weight:700">AUTO 2×/DAY</span>
          </div>
          <?php endif; ?>
        </div>

        <!-- Fetch Live Rate -->
        <form method="post" style="margin-bottom:14px">
          <input type="hidden" name="action" value="fetch_live">
          <button type="submit" class="btn btn-success" style="width:100%;padding:11px;font-size:14px;gap:8px">
            <i class="bi bi-arrow-repeat"></i> Fetch Live Rate (CoinGecko)
          </button>
        </form>

        <div style="display:flex;align-items:center;gap:10px;margin:14px 0">
          <hr style="flex:1;border:none;border-top:1px solid #e2e8f0">
          <span style="color:#94a3b8;font-size:12px;font-weight:600">OR SET MANUALLY</span>
          <hr style="flex:1;border:none;border-top:1px solid #e2e8f0">
        </div>

        <form method="post">
          <input type="hidden" name="action" value="update_price">
          <div class="form-group" style="margin-bottom:14px">
            <label>Manual USDT Price (PKR)</label>
            <input type="number" name="usdt_price" value="<?= $currentPrice ?>" min="1" step="0.01" placeholder="280.00" style="font-size:16px;padding:12px">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:11px;font-size:14px"><i class="bi bi-floppy-fill"></i> Save Manual Price</button>
        </form>
      </div>
    </div>

    <!-- Quick calculator -->
    <div class="card" style="margin-top:22px">
      <div class="card-header"><div class="card-title"><i class="bi bi-calculator-fill"></i> Quick Calculator</div></div>
      <div class="card-body">
        <div class="form-group" style="margin-bottom:12px">
          <label>PKR Amount</label>
          <input type="number" id="calc-pkr" placeholder="0.00" oninput="calcUsdt()" style="font-size:15px">
        </div>
        <div style="text-align:center;padding:4px 0 12px;color:#94a3b8">↕</div>
        <div class="form-group">
          <label>USDT Equivalent</label>
          <input type="number" id="calc-usdt" placeholder="0.000000" oninput="calcPkr()" style="font-size:15px">
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center">At current rate: ₨<?= number_format($currentPrice,2) ?> = 1 USDT</p>
      </div>
    </div>
  </div>

  <!-- Stats + Recent -->
  <div>
    <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:22px">
      <div class="stat-card green"><div class="stat-icon green"><i class="bi bi-check-circle-fill"></i></div><div class="stat-body"><div class="stat-label">Paid USDT</div><div class="stat-value"><?= number_format($totalWithdrawalsUsdt,2) ?></div></div></div>
      <div class="stat-card green"><div class="stat-icon green"><i class="bi bi-cash-stack"></i></div><div class="stat-body"><div class="stat-label">Paid PKR</div><div class="stat-value">₨<?= number_format($totalWithdrawalsPkr,0) ?></div></div></div>
      <div class="stat-card orange"><div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div><div class="stat-body"><div class="stat-label">Pending USDT</div><div class="stat-value"><?= number_format($pendingUsdt,2) ?></div></div></div>
      <div class="stat-card orange"><div class="stat-icon orange"><i class="bi bi-hourglass-split"></i></div><div class="stat-body"><div class="stat-label">Pending PKR</div><div class="stat-value">₨<?= number_format($pendingPkr,0) ?></div></div></div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title"><i class="bi bi-arrow-down-circle-fill"></i> Recent Withdrawals</div><a href="withdrawals.php" class="btn btn-outline btn-sm">View All</a></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>User</th><th>PKR</th><th>USDT</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
          <?php foreach($recent as $r): ?>
          <tr>
            <td><strong><?= htmlspecialchars($r['username']) ?></strong></td>
            <td>₨<?= number_format($r['amount_pkr'],2) ?></td>
            <td><?= number_format($r['amount_usdt'],4) ?> USDT</td>
            <td>
              <?php $cls=['pending'=>'badge-pending','success'=>'badge-success','rejected'=>'badge-danger'][$r['status']]??'badge-inactive'; ?>
              <span class="badge <?=$cls?>"><?= ucfirst($r['status']==='success'?'Paid':$r['status']) ?></span>
            </td>
            <td><?= date('d M Y', strtotime($r['created_at'])) ?></td>
          </tr>
          <?php endforeach; ?>
          <?php if(empty($recent)): ?><tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">No withdrawals yet</td></tr><?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script>
const rate = <?= $currentPrice ?>;
function calcUsdt() {
  const pkr = parseFloat(document.getElementById('calc-pkr').value) || 0;
  document.getElementById('calc-usdt').value = pkr > 0 ? (pkr / rate).toFixed(6) : '';
}
function calcPkr() {
  const usdt = parseFloat(document.getElementById('calc-usdt').value) || 0;
  document.getElementById('calc-pkr').value = usdt > 0 ? (usdt * rate).toFixed(2) : '';
}
</script>
<?php include 'layout_footer.php'; ?>
