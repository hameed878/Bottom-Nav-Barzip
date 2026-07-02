<?php
require_once 'config.php';

if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';
    if ($u === ADMIN_USER && $p === ADMIN_PASS) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user'] = $u;
        header('Location: dashboard.php');
        exit;
    }
    $error = 'Invalid username or password.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Login — XRT.LLC</title>
<link rel="icon" type="image/png" href="favicon.png">
<link rel="shortcut icon" href="favicon.png">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #0f3460 0%, #1a2035 50%, #16213e 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .login-box {
    background: #fff; border-radius: 20px; padding: 44px 40px;
    width: 100%; max-width: 420px;
    box-shadow: 0 25px 60px rgba(0,0,0,.3);
  }
  .login-logo {
    text-align: center; margin-bottom: 32px;
  }
  .logo-circle {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #26dad2, #0077b6);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; margin: 0 auto 14px;
    box-shadow: 0 8px 24px rgba(38,218,210,.35);
  }
  .login-logo h1 { font-size: 22px; font-weight: 800; color: #1a2035; }
  .login-logo p  { color: #8898aa; font-size: 13px; margin-top: 4px; }

  .form-group { margin-bottom: 18px; }
  label { display: block; font-size: 12px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 7px; }
  input[type=text], input[type=password] {
    width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px;
    padding: 12px 16px; font-size: 14px; color: #2d3748;
    transition: border-color .2s, box-shadow .2s; outline: none;
  }
  input:focus { border-color: #26dad2; box-shadow: 0 0 0 3px rgba(38,218,210,.12); }

  .btn-login {
    width: 100%; padding: 13px; background: linear-gradient(135deg, #26dad2, #0077b6);
    color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
    cursor: pointer; transition: opacity .2s; margin-top: 6px;
  }
  .btn-login:hover { opacity: .9; }

  .error {
    background: rgba(231,76,60,.1); border: 1px solid rgba(231,76,60,.25);
    color: #c0392b; padding: 11px 16px; border-radius: 8px;
    font-size: 13px; margin-bottom: 18px; text-align: center;
  }
  .footer-text { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 22px; }
</style>
</head>
<body>
<div class="login-box">
  <div class="login-logo">
    <div class="logo-circle"><i class="bi bi-trophy-fill" style="font-size:32px;color:#fff"></i></div>
    <h1>XRT.LLC Admin</h1>
    <p>Sports Betting Management Panel</p>
  </div>
  <?php if ($error): ?>
  <div class="error"><i class="bi bi-exclamation-triangle-fill"></i> <?= htmlspecialchars($error) ?></div>
  <?php endif; ?>
  <form method="post" action="">
    <div class="form-group">
      <label>Username</label>
      <input type="text" name="username" placeholder="admin" autocomplete="username" required>
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" name="password" placeholder="••••••••" autocomplete="current-password" required>
    </div>
    <button type="submit" class="btn-login">Sign In to Admin Panel</button>
  </form>
  <p class="footer-text">© <?= date('Y') ?> XRT.LLC · Admin Panel v1.0</p>
</div>
</body>
</html>
