<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Payment Address';

$db  = getDB();
$msg = $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $addr = trim($_POST['trc20_address'] ?? '');
    if ($addr === '') {
        $err = 'Address cannot be empty.';
    } else {
        $st = $db->prepare("INSERT INTO admin_settings (key, value, updated_at)
                             VALUES ('trc20_address', ?, NOW())
                             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()");
        $st->execute([$addr]);
        $msg = 'TRC20 address updated successfully.';
    }
}

$currentAddress = setting('trc20_address', 'TF8XLURccFp8Tb1LFjFG33BApP9YVFp6ML');
$qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' . urlencode($currentAddress) . '&bgcolor=ffffff&color=000000&margin=10';

include 'layout_header.php';
?>

<div class="page-header">
  <h1>Payment Address</h1>
  <p>Manage the TRC20 (USDT) deposit wallet address shown to users during recharge</p>
</div>

<?php if ($msg): ?>
<div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div>
<?php endif; ?>
<?php if ($err): ?>
<div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($err) ?></div>
<?php endif; ?>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start">

  <!-- Edit form -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="bi bi-pencil-square"></i> Edit TRC20 Address</div>
    </div>
    <div class="card-body">
      <form method="post">
        <?= csrfField() ?>
        <div class="form-group" style="margin-bottom:18px">
          <label>TRC20 Wallet Address</label>
          <input
            type="text"
            name="trc20_address"
            value="<?= htmlspecialchars($currentAddress) ?>"
            placeholder="T..."
            required
            style="font-family:monospace;font-size:13px;letter-spacing:.4px"
          >
          <small style="color:#94a3b8;font-size:11.5px;margin-top:4px;display:block">
            Enter the USDT TRC20 wallet address where users will send deposits.
          </small>
        </div>

        <!-- Live QR preview updates on input -->
        <div style="margin-bottom:18px;text-align:center">
          <p style="font-size:12px;font-weight:700;color:#4b5563;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Live Preview</p>
          <div style="display:inline-block;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px">
            <img id="previewQr"
                 src="<?= htmlspecialchars($qrUrl) ?>"
                 alt="QR Preview"
                 width="160" height="160"
                 style="display:block;border-radius:6px">
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save Address
        </button>
      </form>
    </div>
  </div>

  <!-- Current QR display -->
  <div class="card">
    <div class="card-header">
      <div class="card-title"><i class="bi bi-qr-code"></i> Current QR Code</div>
    </div>
    <div class="card-body" style="display:flex;flex-direction:column;align-items:center;gap:16px">
      <div style="background:#fff;border:2px solid #e2e8f0;border-radius:16px;padding:16px">
        <img src="<?= htmlspecialchars($qrUrl) ?>"
             alt="USDT TRC20 QR Code"
             width="220" height="220"
             style="display:block;border-radius:8px">
      </div>
      <div style="background:#f8fafc;border-radius:10px;padding:12px 16px;width:100%;text-align:center">
        <p style="font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Active Address</p>
        <code style="font-size:12px;color:#1a2035;word-break:break-all;line-height:1.6"><?= htmlspecialchars($currentAddress) ?></code>
      </div>
      <button onclick="copyAddress()" class="btn btn-outline btn-sm" style="width:100%">
        <i class="bi bi-clipboard"></i> Copy Address
      </button>
    </div>
  </div>

</div>

<script>
/* Live QR preview as admin types */
(function () {
  const input = document.querySelector('input[name="trc20_address"]');
  const preview = document.getElementById('previewQr');
  let timer;
  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      const addr = input.value.trim();
      if (addr.length > 10) {
        preview.src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' +
          encodeURIComponent(addr) + '&bgcolor=ffffff&color=000000&margin=10';
      }
    }, 600);
  });
})();

function copyAddress() {
  const addr = <?= json_encode($currentAddress) ?>;
  navigator.clipboard.writeText(addr).then(function () {
    const btn = document.querySelector('button[onclick="copyAddress()"]');
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
    btn.style.color = '#2ecc71';
    btn.style.borderColor = '#2ecc71';
    setTimeout(function () {
      btn.innerHTML = '<i class="bi bi-clipboard"></i> Copy Address';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}
</script>

<?php include 'layout_footer.php'; ?>
