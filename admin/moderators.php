<?php
require_once 'config.php';
requireLogin();
$pageTitle = 'Moderators';

$db = getDB();
$msg = $err = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add') {
        $username = trim($_POST['username'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        if ($username && $password) {
            try {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $db->prepare("INSERT INTO admin_moderators (username, email, password_hash) VALUES (?,?,?)")
                   ->execute([$username, $email ?: null, $hash]);
                $msg = "Moderator '$username' added.";
            } catch(PDOException $e) {
                $err = str_contains($e->getMessage(), 'unique') ? "Username already exists." : $e->getMessage();
            }
        } else { $err = "Username and password are required."; }

    } elseif ($action === 'toggle') {
        $mid = (int)($_POST['mod_id'] ?? 0);
        $db->prepare("UPDATE admin_moderators SET status = CASE WHEN status='active' THEN 'inactive' ELSE 'active' END WHERE id=?")->execute([$mid]);
        $msg = "Moderator status toggled.";

    } elseif ($action === 'reset_pass') {
        $mid  = (int)($_POST['mod_id'] ?? 0);
        $pass = $_POST['new_password'] ?? '';
        if ($mid && strlen($pass) >= 6) {
            $hash = password_hash($pass, PASSWORD_BCRYPT);
            $db->prepare("UPDATE admin_moderators SET password_hash=? WHERE id=?")->execute([$hash, $mid]);
            $msg = "Password reset for moderator #$mid.";
        } else { $err = "Password must be at least 6 characters."; }

    } elseif ($action === 'delete') {
        $mid = (int)($_POST['mod_id'] ?? 0);
        $db->prepare("DELETE FROM admin_moderators WHERE id=?")->execute([$mid]);
        $msg = "Moderator deleted.";
    }
}

$mods = $db->query("SELECT * FROM admin_moderators ORDER BY created_at DESC")->fetchAll();

include 'layout_header.php';
?>
<div class="page-header">
  <h1>Moderators</h1>
  <p>Manage admin panel moderator accounts</p>
</div>

<?php if($msg): ?><div class="alert alert-success"><i class="bi bi-check-circle-fill"></i> <?= htmlspecialchars($msg) ?></div><?php endif; ?>
<?php if($err): ?><div class="alert alert-danger"><i class="bi bi-x-circle-fill"></i> <?= htmlspecialchars($err) ?></div><?php endif; ?>

<!-- Add Moderator -->
<div class="card" style="margin-bottom:22px">
  <div class="card-header"><div class="card-title"><i class="bi bi-plus-circle-fill"></i> Add New Moderator</div></div>
  <div class="card-body">
    <form method="post">
      <input type="hidden" name="action" value="add">
      <div class="form-grid">
        <div class="form-group">
          <label>Username *</label>
          <input type="text" name="username" placeholder="moderator_name" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" placeholder="mod@example.com">
        </div>
        <div class="form-group">
          <label>Password *</label>
          <input type="password" name="password" placeholder="Min 6 characters" required>
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end">
          <button type="submit" class="btn btn-primary" style="width:100%">Add Moderator</button>
        </div>
      </div>
    </form>
  </div>
</div>

<div class="card">
  <div class="card-header"><div class="card-title"><i class="bi bi-shield-fill"></i> All Moderators</div><span style="color:#94a3b8;font-size:13px"><?= count($mods) ?> total</span></div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>#</th><th>Username</th><th>Email</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>
      <?php if(empty($mods)): ?>
      <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:32px">No moderators yet. Add one above.</td></tr>
      <?php endif; ?>
      <?php foreach($mods as $m): ?>
      <tr>
        <td><code><?=$m['id']?></code></td>
        <td><strong><i class="bi bi-shield-fill" style="color:#26dad2"></i> <?= htmlspecialchars($m['username']) ?></strong></td>
        <td><?= htmlspecialchars($m['email']??'—') ?></td>
        <td>
          <span class="badge <?= $m['status']==='active'?'badge-success':'badge-inactive' ?>">
            <?= ucfirst($m['status']) ?>
          </span>
        </td>
        <td><?= date('d M Y', strtotime($m['created_at'])) ?></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          <form method="post" style="display:inline">
            <input type="hidden" name="action" value="toggle">
            <input type="hidden" name="mod_id" value="<?=$m['id']?>">
            <button type="submit" class="btn btn-warning btn-sm"><?= $m['status']==='active'?'Disable':'Enable' ?></button>
          </form>
          <button class="btn btn-primary btn-sm" onclick="openPassReset(<?=$m['id']?>, '<?= htmlspecialchars($m['username']) ?>')">Reset PW</button>
          <form method="post" style="display:inline" data-confirm="Delete this moderator? This cannot be undone." data-confirm-type="danger">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="mod_id" value="<?=$m['id']?>">
            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>

<!-- Password Reset Modal -->
<div class="modal-backdrop" id="passModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title"><i class="bi bi-key-fill"></i> Reset Password — <span id="pass-name"></span></div>
      <button class="modal-close" onclick="closePass()">✕</button>
    </div>
    <form method="post">
      <input type="hidden" name="action" value="reset_pass">
      <input type="hidden" name="mod_id" id="pass-mid">
      <div class="form-group">
        <label>New Password (min 6 chars)</label>
        <input type="password" name="new_password" placeholder="New password" required minlength="6">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closePass()">Cancel</button>
        <button type="submit" class="btn btn-primary">Reset Password</button>
      </div>
    </form>
  </div>
</div>
<script>
function openPassReset(id,name){ document.getElementById('pass-mid').value=id; document.getElementById('pass-name').textContent=name; document.getElementById('passModal').classList.add('open'); }
function closePass(){ document.getElementById('passModal').classList.remove('open'); }
document.getElementById('passModal').addEventListener('click',e=>{ if(e.target===e.currentTarget)closePass(); });
</script>
<?php include 'layout_footer.php'; ?>
