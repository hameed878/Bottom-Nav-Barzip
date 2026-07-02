<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'API Settings';

$db = getDB();
$msg = $err = '';

// ── Bootstrap new settings keys ──────────────────────────────────────────────
$db->exec("
    INSERT INTO admin_settings (key, value) VALUES ('football_api_key',  '') ON CONFLICT (key) DO NOTHING;
    INSERT INTO admin_settings (key, value) VALUES ('football_api_url',  'https://v3.football.api-sports.io') ON CONFLICT (key) DO NOTHING;
    INSERT INTO admin_settings (key, value) VALUES ('exchange_rate_api_url', 'https://v6.exchangerate-api.com/v6/f0b20f4900a31caefc6bc880/latest/USD') ON CONFLICT (key) DO NOTHING;
    INSERT INTO admin_settings (key, value) VALUES ('exchange_rate_api_key', '') ON CONFLICT (key) DO NOTHING;
");

// ── Handle form submissions ───────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $section = $_POST['section'] ?? '';

    if ($section === 'sports') {
        $key = trim($_POST['football_api_key'] ?? '');
        $url = rtrim(trim($_POST['football_api_url'] ?? ''), '/');
        if ($url === '') { $err = 'Football API base URL cannot be empty.'; }
        else {
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('football_api_key',?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")->execute([$key]);
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('football_api_url',?,NOW())  ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")->execute([$url]);
            $msg = 'Sports API settings saved.';
        }

    } elseif ($section === 'currency') {
        $url = trim($_POST['exchange_rate_api_url'] ?? '');
        $key = trim($_POST['exchange_rate_api_key'] ?? '');
        if ($url === '') { $err = 'Exchange rate API URL cannot be empty.'; }
        else {
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('exchange_rate_api_url',?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")->execute([$url]);
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES ('exchange_rate_api_key',?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")->execute([$key]);
            $msg = 'Currency API settings saved.';
        }
    }
}

// ── Load current values ───────────────────────────────────────────────────────
$footballKey    = setting('football_api_key', getenv('FOOTBALL_API_KEY') ?: '');
$footballUrl    = setting('football_api_url', 'https://v3.football.api-sports.io');
$exchangeUrl    = setting('exchange_rate_api_url', 'https://v6.exchangerate-api.com/v6/f0b20f4900a31caefc6bc880/latest/USD');
$exchangeKey    = setting('exchange_rate_api_key', '');

// DB info from env
$dbHost = getenv('PGHOST') ?: 'localhost';
$dbPort = getenv('PGPORT') ?: '5432';
$dbName = getenv('PGDATABASE') ?: 'postgres';
$dbUser = getenv('PGUSER') ?: 'postgres';

// DB test
$dbStatus = 'connected';
$dbError  = '';
try {
    $db->query("SELECT 1");
} catch (Exception $e) {
    $dbStatus = 'error';
    $dbError  = $e->getMessage();
}

// Get updated_at for each section
function settingUpdated(PDO $db, string $key): string {
    $st = $db->prepare("SELECT updated_at FROM admin_settings WHERE key=?");
    $st->execute([$key]);
    $row = $st->fetch();
    return $row && $row['updated_at'] ? date('d M Y H:i', strtotime($row['updated_at'])) : 'Never';
}
$sportsUpdated   = settingUpdated($db, 'football_api_url');
$currencyUpdated = settingUpdated($db, 'exchange_rate_api_url');

include 'layout_header.php';
?>

<div class="page-header">
  <h1><i class="bi bi-plug-fill" style="color:var(--accent)"></i> API Settings</h1>
  <p>Configure external API keys and endpoints used by the platform</p>
</div>

<?php if ($msg): ?>
<div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div>
<?php endif; ?>
<?php if ($err): ?>
<div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($err) ?></div>
<?php endif; ?>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start">

  <!-- ── Sports API ─────────────────────────────────────── -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <span style="display:inline-flex;align-items:center;gap:8px">
          <span style="width:32px;height:32px;border-radius:8px;background:rgba(52,152,219,.12);display:inline-flex;align-items:center;justify-content:center">
            <i class="bi bi-trophy-fill" style="color:var(--info);font-size:15px"></i>
          </span>
          Sports API (Football)
        </span>
      </div>
      <span style="font-size:11px;color:#94a3b8"><i class="bi bi-clock"></i> Updated: <?= htmlspecialchars($sportsUpdated) ?></span>
    </div>
    <div class="card-body">
      <div class="alert alert-info" style="font-size:12px;margin-bottom:18px">
        <i class="bi bi-info-circle-fill"></i>
        Changes here override the <code>FOOTBALL_API_KEY</code> environment variable. Restart the API server after saving.
      </div>

      <form method="post">
        <?= csrfField() ?>
        <input type="hidden" name="section" value="sports">

        <div class="form-group" style="margin-bottom:16px">
          <label>API Key <span style="color:var(--text-muted);font-weight:400;text-transform:none">(leave blank to use env var)</span></label>
          <div style="position:relative">
            <input type="password" name="football_api_key" id="football_api_key"
                   value="<?= htmlspecialchars($footballKey) ?>"
                   placeholder="e.g. 7d6f52a688f992bf29f118e98f418e75"
                   autocomplete="off">
            <button type="button" onclick="toggleVisibility('football_api_key',this)"
                    style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;font-size:14px">
              <i class="bi bi-eye"></i>
            </button>
          </div>
          <?php if ($footballKey): ?>
          <div style="margin-top:5px;font-size:11px;color:#64748b">
            <i class="bi bi-check-circle-fill" style="color:var(--success)"></i>
            Key set — <code><?= substr(htmlspecialchars($footballKey), 0, 6) ?>••••••••••••••••••</code>
          </div>
          <?php else: ?>
          <div style="margin-top:5px;font-size:11px;color:#94a3b8"><i class="bi bi-exclamation-circle"></i> No key stored — using env var</div>
          <?php endif; ?>
        </div>

        <div class="form-group" style="margin-bottom:20px">
          <label>Base URL</label>
          <input type="text" name="football_api_url"
                 value="<?= htmlspecialchars($footballUrl) ?>"
                 placeholder="https://v3.football.api-sports.io">
          <div style="margin-top:5px;font-size:11px;color:#94a3b8">
            Endpoint used: <code><?= htmlspecialchars($footballUrl) ?>/fixtures</code>
          </div>
        </div>

        <!-- Test connection -->
        <div style="margin-bottom:16px;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
          <div style="font-size:12px;font-weight:700;color:#4b5563;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">
            <i class="bi bi-activity"></i> Live Test
          </div>
          <button type="button" onclick="testSportsApi()" class="btn btn-outline btn-sm" id="test-sports-btn">
            <i class="bi bi-play-fill"></i> Test Connection
          </button>
          <div id="test-sports-result" style="margin-top:10px;font-size:12px;display:none"></div>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;padding:11px">
          <i class="bi bi-floppy-fill"></i> Save Sports API Settings
        </button>
      </form>
    </div>
  </div>

  <!-- ── Currency API ───────────────────────────────────── -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <span style="display:inline-flex;align-items:center;gap:8px">
          <span style="width:32px;height:32px;border-radius:8px;background:rgba(46,204,113,.12);display:inline-flex;align-items:center;justify-content:center">
            <i class="bi bi-currency-exchange" style="color:var(--success);font-size:15px"></i>
          </span>
          Currency / Exchange Rate API
        </span>
      </div>
      <span style="font-size:11px;color:#94a3b8"><i class="bi bi-clock"></i> Updated: <?= htmlspecialchars($currencyUpdated) ?></span>
    </div>
    <div class="card-body">
      <div class="alert alert-info" style="font-size:12px;margin-bottom:18px">
        <i class="bi bi-info-circle-fill"></i>
        This API fetches the USD → PKR rate. Used for USDT conversion. Default uses ExchangeRate-API v6.
      </div>

      <form method="post">
        <?= csrfField() ?>
        <input type="hidden" name="section" value="currency">

        <div class="form-group" style="margin-bottom:16px">
          <label>API URL <span style="color:var(--danger)" title="Required">*</span></label>
          <textarea name="exchange_rate_api_url" rows="3"
                    placeholder="https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/USD"
                    style="font-size:12px;font-family:monospace"><?= htmlspecialchars($exchangeUrl) ?></textarea>
          <div style="margin-top:5px;font-size:11px;color:#94a3b8">
            Full URL including your API key if it's part of the path (e.g. ExchangeRate-API style).
          </div>
        </div>

        <div class="form-group" style="margin-bottom:20px">
          <label>API Key <span style="color:var(--text-muted);font-weight:400;text-transform:none">(if required as a header)</span></label>
          <div style="position:relative">
            <input type="password" name="exchange_rate_api_key" id="exchange_rate_api_key"
                   value="<?= htmlspecialchars($exchangeKey) ?>"
                   placeholder="Leave blank if key is in the URL"
                   autocomplete="off">
            <button type="button" onclick="toggleVisibility('exchange_rate_api_key',this)"
                    style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;font-size:14px">
              <i class="bi bi-eye"></i>
            </button>
          </div>
        </div>

        <!-- Test connection -->
        <div style="margin-bottom:16px;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
          <div style="font-size:12px;font-weight:700;color:#4b5563;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">
            <i class="bi bi-activity"></i> Live Test
          </div>
          <button type="button" onclick="testCurrencyApi()" class="btn btn-outline btn-sm" id="test-currency-btn">
            <i class="bi bi-play-fill"></i> Test Connection
          </button>
          <div id="test-currency-result" style="margin-top:10px;font-size:12px;display:none"></div>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;padding:11px">
          <i class="bi bi-floppy-fill"></i> Save Currency API Settings
        </button>
      </form>
    </div>
  </div>

</div>

<!-- ── Database ──────────────────────────────────────────────────────────── -->
<div class="card" style="margin-top:4px">
  <div class="card-header">
    <div class="card-title">
      <span style="display:inline-flex;align-items:center;gap:8px">
        <span style="width:32px;height:32px;border-radius:8px;background:rgba(245,166,35,.12);display:inline-flex;align-items:center;justify-content:center">
          <i class="bi bi-database-fill" style="color:var(--accent2);font-size:15px"></i>
        </span>
        Database Connection
      </span>
    </div>
    <?php if ($dbStatus === 'connected'): ?>
    <span class="badge badge-success"><i class="bi bi-circle-fill" style="font-size:8px"></i> Connected</span>
    <?php else: ?>
    <span class="badge badge-danger"><i class="bi bi-circle-fill" style="font-size:8px"></i> Error</span>
    <?php endif; ?>
  </div>
  <div class="card-body">
    <?php if ($dbStatus === 'error'): ?>
    <div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($dbError) ?></div>
    <?php endif; ?>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px">
      <?php
      $fields = [
        ['Host',     $dbHost,            'bi-hdd-network-fill',    'teal'],
        ['Port',     $dbPort,            'bi-ethernet',            'blue'],
        ['Database', $dbName,            'bi-database-fill',       'orange'],
        ['User',     $dbUser,            'bi-person-fill',         'green'],
        ['Password', '••••••••',         'bi-key-fill',            'red'],
        ['SSL Mode', 'prefer',           'bi-shield-lock-fill',    'teal'],
      ];
      foreach ($fields as [$label, $value, $icon, $color]): ?>
      <div style="background:#f8fafc;border-radius:10px;padding:14px 16px;border:1px solid #e8ecf0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="width:28px;height:28px;border-radius:6px;background:rgba(38,218,210,.1);display:flex;align-items:center;justify-content:center">
            <i class="bi <?= $icon ?>" style="font-size:13px;color:var(--accent)"></i>
          </span>
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px"><?= $label ?></span>
        </div>
        <div style="font-size:14px;font-weight:700;color:#1a2035;font-family:monospace"><?= htmlspecialchars($value) ?></div>
      </div>
      <?php endforeach; ?>
    </div>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="font-size:12px;color:#64748b;background:#f1f5f9;border-radius:6px;padding:8px 14px;font-family:monospace;flex:1;word-break:break-all">
        pgsql:host=<?= htmlspecialchars($dbHost) ?>;port=<?= htmlspecialchars($dbPort) ?>;dbname=<?= htmlspecialchars($dbName) ?>;sslmode=prefer
      </div>
      <button type="button" onclick="testDbConnection()" class="btn btn-outline btn-sm" id="test-db-btn">
        <i class="bi bi-arrow-repeat"></i> Re-test Connection
      </button>
    </div>

    <div id="test-db-result" style="margin-top:14px;font-size:13px;display:none"></div>

    <div class="alert alert-info" style="margin-top:16px;margin-bottom:0;font-size:12px">
      <i class="bi bi-info-circle-fill"></i>
      Database credentials are managed via environment variables (<code>PGHOST</code>, <code>PGPORT</code>, <code>PGDATABASE</code>, <code>PGUSER</code>, <code>PGPASSWORD</code>).
      To change them, update your Replit Secrets panel and restart the app.
    </div>
  </div>
</div>

<script>
function toggleVisibility(id, btn) {
  const el = document.getElementById(id);
  if (el.type === 'password') {
    el.type = 'text';
    btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
  } else {
    el.type = 'password';
    btn.innerHTML = '<i class="bi bi-eye"></i>';
  }
}

function showResult(id, ok, msg) {
  const el = document.getElementById(id);
  el.style.display = 'block';
  el.innerHTML = ok
    ? `<span style="color:var(--success)"><i class="bi bi-check-circle-fill"></i> ${msg}</span>`
    : `<span style="color:var(--danger)"><i class="bi bi-x-circle-fill"></i> ${msg}</span>`;
}

async function testSportsApi() {
  const btn = document.getElementById('test-sports-btn');
  btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Testing…';
  try {
    const res = await fetch('/api/fixtures?date=' + new Date().toISOString().split('T')[0]);
    const data = await res.json();
    if (data.ok) {
      const count = Array.isArray(data.data?.response) ? data.data.response.length : '?';
      showResult('test-sports-result', true, `Connected — ${count} fixtures returned (requests used: ${data.requestCount})`);
    } else {
      showResult('test-sports-result', false, data.error || 'API returned error');
    }
  } catch(e) {
    showResult('test-sports-result', false, 'Request failed: ' + e.message);
  }
  btn.disabled = false; btn.innerHTML = '<i class="bi bi-play-fill"></i> Test Connection';
}

async function testCurrencyApi() {
  const btn = document.getElementById('test-currency-btn');
  btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Testing…';
  try {
    const res = await fetch('/api/exchange-rate');
    const data = await res.json();
    if (data.ok) {
      showResult('test-currency-result', true, `Connected — 1 USD = ₨${data.usdToPkr?.toFixed(2)} PKR`);
    } else {
      showResult('test-currency-result', false, data.error || 'API returned error');
    }
  } catch(e) {
    showResult('test-currency-result', false, 'Request failed: ' + e.message);
  }
  btn.disabled = false; btn.innerHTML = '<i class="bi bi-play-fill"></i> Test Connection';
}

async function testDbConnection() {
  const btn = document.getElementById('test-db-btn');
  btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Testing…';
  // Just reload the page to re-run PHP DB test
  setTimeout(() => { window.location.reload(); }, 400);
}
</script>

<?php include 'layout_footer.php'; ?>
