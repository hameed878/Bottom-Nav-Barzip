<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Home Page Settings';

$db = getDB();
$msg = '';

$uploadDir = __DIR__ . '/uploads/';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fields = ['site_name','site_tagline','maintenance_mode','min_deposit','min_withdrawal',
               'welcome_message','support_telegram','support_whatsapp','announcement'];
    foreach ($fields as $f) {
        if (isset($_POST[$f])) {
            $val = trim($_POST[$f]);
            $db->prepare("INSERT INTO admin_settings (key, value, updated_at) VALUES (?,?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()")
               ->execute([$f, $val]);
        }
    }

    for ($b = 1; $b <= 5; $b++) {
        // Upload new image
        if (!empty($_FILES["banner_$b"]['name'])) {
            $file = $_FILES["banner_$b"];
            $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg','jpeg','png','gif','webp']) && $file['size'] < 5*1024*1024) {
                $fname = "banner_{$b}_" . time() . ".$ext";
                if (move_uploaded_file($file['tmp_name'], $uploadDir . $fname)) {
                    $old = setting("banner_$b", '');
                    if ($old && file_exists($uploadDir . basename($old))) @unlink($uploadDir . basename($old));
                    $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES (?,?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")
                       ->execute(["banner_$b", $fname]);
                    // Reset paused state on new upload
                    $db->prepare("DELETE FROM admin_settings WHERE key=?")->execute(["banner_{$b}_paused"]);
                }
            }
        }
        // Delete banner
        if (!empty($_POST["remove_banner_$b"])) {
            $old = setting("banner_$b", '');
            if ($old && file_exists($uploadDir . basename($old))) @unlink($uploadDir . basename($old));
            $db->prepare("DELETE FROM admin_settings WHERE key=?")->execute(["banner_$b"]);
            $db->prepare("DELETE FROM admin_settings WHERE key=?")->execute(["banner_{$b}_paused"]);
            $msg = "Banner $b removed.";
        }
        // Pause banner
        if (!empty($_POST["pause_banner_$b"])) {
            $db->prepare("INSERT INTO admin_settings (key,value,updated_at) VALUES (?,?,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()")
               ->execute(["banner_{$b}_paused", '1']);
            $msg = "Banner $b paused — hidden from users.";
        }
        // Unpause banner
        if (!empty($_POST["unpause_banner_$b"])) {
            $db->prepare("DELETE FROM admin_settings WHERE key=?")->execute(["banner_{$b}_paused"]);
            $msg = "Banner $b is now live.";
        }
    }

    if (!$msg) $msg = "Settings saved successfully!";
}

$rows = $db->query("SELECT key, value FROM admin_settings")->fetchAll();
$s = []; foreach($rows as $r) $s[$r['key']] = $r['value'];

include 'layout_header.php';
?>
<div class="page-header">
  <h1>Home Page Settings</h1>
  <p>Configure the site's public-facing content and platform settings</p>
</div>

<?php if($msg): ?><div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div><?php endif; ?>

<form method="post" enctype="multipart/form-data">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;">

  <!-- General -->
  <div class="card">
    <div class="card-header"><div class="card-title"><i class="bi bi-globe"></i> General Settings</div></div>
    <div class="card-body">
      <div class="form-group" style="margin-bottom:16px">
        <label>Site Name</label>
        <input type="text" name="site_name" value="<?= htmlspecialchars($s['site_name']??'XRT.LLC') ?>">
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>Site Tagline</label>
        <input type="text" name="site_tagline" value="<?= htmlspecialchars($s['site_tagline']??'Sports Betting Platform') ?>">
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>Welcome Message</label>
        <textarea name="welcome_message"><?= htmlspecialchars($s['welcome_message']??'Welcome to XRT.LLC!') ?></textarea>
      </div>
      <div class="form-group">
        <label>Maintenance Mode</label>
        <select name="maintenance_mode">
          <option value="0" <?= ($s['maintenance_mode']??'0')==='0'?'selected':'' ?>>Off — Site is live</option>
          <option value="1" <?= ($s['maintenance_mode']??'0')==='1'?'selected':'' ?>>On — Maintenance mode</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Finance -->
  <div class="card">
    <div class="card-header"><div class="card-title"><i class="bi bi-cash-stack"></i> Finance Limits</div></div>
    <div class="card-body">
      <div class="form-group" style="margin-bottom:16px">
        <label>Minimum Deposit (PKR)</label>
        <input type="number" name="min_deposit" value="<?= htmlspecialchars($s['min_deposit']??'500') ?>" min="0" step="1">
      </div>
      <div class="form-group" style="margin-bottom:16px">
        <label>Minimum Withdrawal (PKR)</label>
        <input type="number" name="min_withdrawal" value="<?= htmlspecialchars($s['min_withdrawal']??'1000') ?>" min="0" step="1">
      </div>
    </div>
  </div>

  <!-- Support -->
  <div class="card">
    <div class="card-header"><div class="card-title"><i class="bi bi-chat-dots-fill"></i> Support Contacts</div></div>
    <div class="card-body">
      <div class="form-group" style="margin-bottom:16px">
        <label>Telegram Handle / Link</label>
        <input type="text" name="support_telegram" value="<?= htmlspecialchars($s['support_telegram']??'') ?>" placeholder="@xrtllc_support">
      </div>
      <div class="form-group">
        <label>WhatsApp Number</label>
        <input type="text" name="support_whatsapp" value="<?= htmlspecialchars($s['support_whatsapp']??'') ?>" placeholder="+923001234567">
      </div>
    </div>
  </div>

  <!-- Announcement -->
  <div class="card">
    <div class="card-header"><div class="card-title"><i class="bi bi-megaphone-fill"></i> Announcement Banner</div></div>
    <div class="card-body">
      <div class="form-group">
        <label>Announcement Text (shown in app)</label>
        <textarea name="announcement" style="min-height:120px"><?= htmlspecialchars($s['announcement']??'') ?></textarea>
        <p style="color:#94a3b8;font-size:11px;margin-top:6px">Leave empty to hide the banner.</p>
      </div>
    </div>
  </div>

</div>

<!-- Banner Images — full width -->
<div class="card" style="margin-top:6px">
  <div class="card-header">
    <div class="card-title"><i class="bi bi-images"></i> Home Screen Banner Images</div>
    <span style="font-size:12px;color:#94a3b8">Up to 5 slides · JPG/PNG/WebP · max 5MB each</span>
  </div>
  <div class="card-body">
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px">

      <?php for ($b = 1; $b <= 5; $b++):
        $bannerFile  = $s["banner_$b"] ?? '';
        $hasImage    = $bannerFile && file_exists($uploadDir . $bannerFile);
        $isPaused    = isset($s["banner_{$b}_paused"]) && $s["banner_{$b}_paused"] === '1';
      ?>
      <div style="border:2px dashed <?= $hasImage ? ($isPaused ? '#f5a623' : '#26dad2') : '#e2e8f0' ?>;border-radius:12px;overflow:hidden;background:#f8fafc;transition:border-color .2s">

        <!-- Preview area -->
        <div style="height:155px;background:#1a2035;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">
          <?php if ($hasImage): ?>
            <img src="/admin/uploads/<?= htmlspecialchars($bannerFile) ?>"
                 alt="Banner <?= $b ?>"
                 style="width:100%;height:100%;object-fit:cover;<?= $isPaused ? 'filter:grayscale(60%) brightness(0.55)' : '' ?>">

            <!-- Paused overlay -->
            <?php if ($isPaused): ?>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(245,166,35,.18)">
              <div style="background:rgba(245,166,35,.92);color:#fff;font-weight:800;font-size:13px;letter-spacing:2px;padding:6px 16px;border-radius:20px;display:flex;align-items:center;gap:6px">
                <i class="bi bi-pause-circle-fill"></i> PAUSED
              </div>
            </div>
            <?php endif; ?>

            <!-- Status badge top-left -->
            <div style="position:absolute;top:7px;left:8px">
              <span style="background:<?= $isPaused ? 'rgba(245,166,35,.9)' : 'rgba(38,218,210,.9)' ?>;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:10px;letter-spacing:.8px">
                <?= $isPaused ? 'PAUSED' : 'LIVE' ?>
              </span>
            </div>

            <!-- Action buttons top-right -->
            <div style="position:absolute;top:6px;right:6px;display:flex;gap:5px">
              <!-- Pause / Unpause -->
              <button type="submit"
                      name="<?= $isPaused ? "unpause_banner_$b" : "pause_banner_$b" ?>"
                      value="1"
                      title="<?= $isPaused ? 'Make banner live' : 'Pause banner' ?>"
                      style="background:<?= $isPaused ? 'rgba(38,218,210,.92)' : 'rgba(245,166,35,.92)' ?>;border:none;color:#fff;border-radius:7px;padding:5px 9px;cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;gap:4px">
                <i class="bi bi-<?= $isPaused ? 'play-fill' : 'pause-fill' ?>"></i>
                <span style="font-size:11px;font-weight:700"><?= $isPaused ? 'Resume' : 'Pause' ?></span>
              </button>
              <!-- Delete -->
              <button type="submit"
                      name="remove_banner_<?= $b ?>"
                      value="1"
                      data-confirm="Delete banner <?= $b ?>? This cannot be undone." data-confirm-type="danger"
                      title="Delete banner"
                      style="background:rgba(231,76,60,.9);border:none;color:#fff;border-radius:7px;padding:5px 9px;cursor:pointer;font-size:13px;line-height:1;display:flex;align-items:center;gap:4px">
                <i class="bi bi-trash-fill"></i>
                <span style="font-size:11px;font-weight:700">Delete</span>
              </button>
            </div>

          <?php else: ?>
            <div style="text-align:center;color:rgba(255,255,255,.2)">
              <i class="bi bi-image" style="font-size:38px;display:block;margin-bottom:8px"></i>
              <span style="font-size:12px">No image uploaded</span>
            </div>
          <?php endif; ?>
        </div>

        <!-- Upload control -->
        <div style="padding:11px 13px">
          <div style="font-size:12px;color:#4b5563;font-weight:700;margin-bottom:7px;display:flex;align-items:center;gap:6px">
            <i class="bi bi-image-fill" style="color:#26dad2"></i>
            Slide <?= $b ?>
            <?php if ($hasImage && !$isPaused): ?>
              <span style="background:rgba(38,218,210,.1);color:#0b8a83;border-radius:4px;padding:1px 6px;font-size:10px">● Live</span>
            <?php elseif ($hasImage && $isPaused): ?>
              <span style="background:rgba(245,166,35,.12);color:#a57800;border-radius:4px;padding:1px 6px;font-size:10px">⏸ Paused</span>
            <?php else: ?>
              <span style="background:#f0f2f5;color:#94a3b8;border-radius:4px;padding:1px 6px;font-size:10px">Empty</span>
            <?php endif; ?>
          </div>
          <input type="file"
                 name="banner_<?= $b ?>"
                 accept="image/jpeg,image/png,image/gif,image/webp"
                 style="font-size:12px;padding:6px;border:1.5px solid #e2e8f0;border-radius:8px;width:100%;background:#fff">
          <p style="font-size:10px;color:#94a3b8;margin-top:4px">Leave blank to keep current · max 5MB</p>
        </div>
      </div>
      <?php endfor; ?>

    </div>

    <div style="margin-top:14px;padding:10px 14px;background:rgba(38,218,210,.05);border-radius:8px;border:1px solid rgba(38,218,210,.15)">
      <p style="font-size:12px;color:#0b8a83">
        <i class="bi bi-info-circle-fill"></i>
        <strong>Tip:</strong> Banners display as a carousel on the app home screen.
        <strong>Pause</strong> temporarily hides a slide from users without deleting it.
        Recommended size: <strong>1200×400px</strong> (3:1 ratio).
      </p>
    </div>
  </div>
</div>

<div style="margin-top:4px;text-align:right;margin-bottom:24px">
  <button type="submit" class="btn btn-primary" style="padding:12px 32px;font-size:15px"><i class="bi bi-floppy-fill"></i> Save All Settings</button>
</div>
</form>

<!-- Current settings overview -->
<div class="card">
  <div class="card-header"><div class="card-title"><i class="bi bi-clipboard-data-fill"></i> Current Settings Overview</div></div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Setting Key</th><th>Value</th></tr></thead>
      <tbody>
      <?php foreach ($s as $k => $v):
        if (strpos($k, 'banner_') === 0) continue; ?>
      <tr><td><code><?= htmlspecialchars($k) ?></code></td><td><?= htmlspecialchars($v) ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php include 'layout_footer.php'; ?>
