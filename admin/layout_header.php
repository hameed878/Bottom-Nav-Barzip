<?php
$currentPage = basename($_SERVER['PHP_SELF'], '.php');

$navIcons = [
    'dashboard'   => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    'matches'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    'members'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'moderators'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'homepage'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    'deposits'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'withdrawals' => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    'vip_levels'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    'usdt_price'    => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'wallet_admin'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/><path d="M2 10h20"/></svg>',
    'api_settings'     => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>',
    'payment_address'  => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/><path d="M14 14h3v3M17 17v3h3M14 17h1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
];
$navItems = [
    'dashboard'    => ['label' => 'Dashboard',    'href' => 'dashboard.php'],
    'matches'      => ['label' => 'Matches',       'href' => 'matches.php'],
    'members'      => ['label' => 'Members',       'href' => 'members.php'],
    'moderators'   => ['label' => 'Moderators',    'href' => 'moderators.php'],
    'homepage'     => ['label' => 'Home Page',     'href' => 'homepage.php'],
    'deposits'     => ['label' => 'Deposits',      'href' => 'deposits.php'],
    'withdrawals'  => ['label' => 'Withdrawals',   'href' => 'withdrawals.php'],
    'wallet_admin' => ['label' => 'Wallet',        'href' => 'wallet_admin.php'],
    'vip_levels'   => ['label' => 'VIP Levels',    'href' => 'vip_levels.php'],
    'usdt_price'   => ['label' => 'USDT Rate',     'href' => 'usdt_price.php'],
    'api_settings'    => ['label' => 'API',             'href' => 'api_settings.php'],
    'payment_address' => ['label' => 'Payment Address', 'href' => 'payment_address.php'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= htmlspecialchars($pageTitle ?? 'Admin Panel') ?> — XRT.LLC Admin</title>
<link rel="icon" type="image/png" href="favicon.png">
<link rel="shortcut icon" href="favicon.png">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --sidebar-w: 240px;
    --sidebar-mini-w: 68px;
    --sidebar-bg: #1a2035;
    --sidebar-hover: #232f4b;
    --sidebar-active: #0f3460;
    --accent: #26dad2;
    --accent2: #f5a623;
    --topbar-h: 60px;
    --text-muted: #8898aa;
    --body-bg: #f0f2f5;
    --card-bg: #fff;
    --danger: #e74c3c;
    --success: #2ecc71;
    --warning: #f39c12;
    --info: #3498db;
    --transition: 0.28s cubic-bezier(.4,0,.2,1);
  }
  html, body { height: 100%; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--body-bg); color: #2d3748; font-size: 14px; }

  /* ── SIDEBAR ── */
  .sidebar {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w);
    background: var(--sidebar-bg);
    display: flex; flex-direction: column;
    z-index: 100; overflow: hidden;
    transition: width var(--transition);
  }

  /* Brand */
  .sidebar-brand {
    display: flex; align-items: center; gap: 10px;
    padding: 20px 16px 16px; border-bottom: 1px solid rgba(255,255,255,.07);
    flex-shrink: 0; min-height: 72px; overflow: hidden;
    white-space: nowrap;
  }
  .brand-icon {
    width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--accent), #0077b6);
    display: flex; align-items: center; justify-content: center;
  }
  .brand-icon svg { width: 18px; height: 18px; stroke: #fff; }
  .brand-name {
    color: #fff; font-weight: 700; font-size: 15px; letter-spacing: .3px;
    opacity: 1; transition: opacity var(--transition), width var(--transition);
    overflow: hidden; white-space: nowrap;
  }

  /* Profile */
  .sidebar-profile {
    display: flex; flex-direction: column; align-items: center;
    padding: 18px 16px 14px; border-bottom: 1px solid rgba(255,255,255,.07);
    flex-shrink: 0; overflow: hidden; transition: padding var(--transition);
  }
  .avatar-circle {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent) 0%, #0077b6 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: #fff;
    border: 3px solid rgba(255,255,255,.15); flex-shrink: 0;
    transition: width var(--transition), height var(--transition), font-size var(--transition);
  }
  .profile-text {
    margin-top: 8px; text-align: center;
    opacity: 1; transition: opacity var(--transition), max-height var(--transition);
    max-height: 60px; overflow: hidden;
  }
  .profile-name { color: #fff; font-weight: 600; font-size: 13px; white-space: nowrap; }
  .profile-role { color: var(--accent); font-size: 10px; margin-top: 3px; letter-spacing: 1.2px; text-transform: uppercase; }

  /* Nav */
  .sidebar-nav { padding: 8px 0; flex: 1; overflow-y: auto; overflow-x: hidden; }
  .nav-label {
    color: rgba(255,255,255,.3); font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; text-transform: uppercase;
    padding: 12px 20px 4px;
    opacity: 1; transition: opacity var(--transition), max-height var(--transition);
    max-height: 40px; overflow: hidden; white-space: nowrap;
  }
  .nav-item { display: block; text-decoration: none; position: relative; }
  .nav-link {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 20px; color: rgba(255,255,255,.62);
    transition: background var(--transition), color var(--transition), padding var(--transition);
    border-left: 3px solid transparent; font-size: 13.5px;
    white-space: nowrap; overflow: hidden;
  }
  .nav-item:hover .nav-link { background: var(--sidebar-hover); color: #fff; }
  .nav-item.active .nav-link { background: var(--sidebar-active); color: var(--accent); border-left-color: var(--accent); font-weight: 600; }
  .nav-icon { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .nav-icon svg { width: 18px; height: 18px; stroke: currentColor; display: block; flex-shrink: 0; }
  .nav-label-text {
    opacity: 1; transition: opacity var(--transition);
    overflow: hidden; white-space: nowrap;
  }

  /* Tooltip when mini */
  .nav-item .nav-tooltip {
    display: none; position: absolute; left: calc(var(--sidebar-mini-w) + 6px); top: 50%;
    transform: translateY(-50%);
    background: #1a2035; color: #fff; padding: 5px 10px; border-radius: 6px;
    font-size: 12px; font-weight: 600; white-space: nowrap; pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,.3); z-index: 200;
  }
  .nav-item .nav-tooltip::before {
    content: ''; position: absolute; right: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent; border-right-color: #1a2035;
  }

  /* Sidebar footer */
  .sidebar-footer { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,.07); flex-shrink: 0; overflow: hidden; }
  .logout-btn {
    display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,.45);
    text-decoration: none; font-size: 13px; padding: 8px 4px; transition: color .2s;
    white-space: nowrap; overflow: hidden;
  }
  .logout-btn svg { width: 16px; height: 16px; stroke: currentColor; flex-shrink: 0; }
  .logout-btn:hover { color: var(--danger); }
  .logout-text { transition: opacity var(--transition); }

  /* ── MINI (collapsed) state ── */
  body.sidebar-mini .sidebar { width: var(--sidebar-mini-w); }
  body.sidebar-mini .brand-name { opacity: 0; width: 0; }
  body.sidebar-mini .sidebar-brand { padding: 20px 16px; justify-content: center; }
  body.sidebar-mini .sidebar-profile { padding: 14px 8px; }
  body.sidebar-mini .profile-text { opacity: 0; max-height: 0; margin-top: 0; }
  body.sidebar-mini .avatar-circle { width: 36px; height: 36px; font-size: 12px; }
  body.sidebar-mini .nav-label { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
  body.sidebar-mini .nav-link { padding: 11px 0; justify-content: center; border-left: none; }
  body.sidebar-mini .nav-item.active .nav-link { border-left: none; border-right: 3px solid var(--accent); }
  body.sidebar-mini .nav-label-text { opacity: 0; width: 0; overflow: hidden; }
  body.sidebar-mini .logout-text { opacity: 0; width: 0; overflow: hidden; }
  body.sidebar-mini .logout-btn { justify-content: center; padding: 8px 0; }
  body.sidebar-mini .nav-item:hover .nav-tooltip { display: block; }
  body.sidebar-mini .sidebar-footer { padding: 12px 8px; }

  /* ── MAIN CONTENT ── */
  .main-content {
    margin-left: var(--sidebar-w);
    min-height: 100vh; display: flex; flex-direction: column;
    transition: margin-left var(--transition);
  }
  body.sidebar-mini .main-content { margin-left: var(--sidebar-mini-w); }

  /* ── TOPBAR ── */
  .topbar {
    height: var(--topbar-h); background: var(--card-bg);
    border-bottom: 1px solid #e8ecf0; display: flex; align-items: center;
    justify-content: space-between; padding: 0 24px 0 20px;
    position: sticky; top: 0; z-index: 90;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .sidebar-toggle {
    background: none; border: none; cursor: pointer; padding: 6px; border-radius: 8px;
    color: #64748b; display: flex; align-items: center; justify-content: center;
    transition: background .18s, color .18s;
  }
  .sidebar-toggle:hover { background: #f0f2f5; color: #1a2035; }
  .sidebar-toggle svg { width: 20px; height: 20px; stroke: currentColor; display: block; }
  .topbar-title { font-size: 17px; font-weight: 700; color: #1a2035; }
  .topbar-right { display: flex; align-items: center; gap: 16px; }
  .topbar-date { color: var(--text-muted); font-size: 12px; }
  .topbar-user { display: flex; align-items: center; gap: 8px; }
  .topbar-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #0077b6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 12px; }
  .topbar-username { font-weight: 600; color: #2d3748; font-size: 13px; }

  /* PAGE CONTENT */
  .page-content { padding: 26px 28px; flex: 1; }
  .page-header { margin-bottom: 24px; }
  .page-header h1 { font-size: 21px; font-weight: 700; color: #1a2035; }
  .page-header p { color: var(--text-muted); margin-top: 4px; font-size: 13px; }

  /* STATS CARDS */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 18px; margin-bottom: 28px; }
  .stat-card {
    background: var(--card-bg); border-radius: 12px; padding: 20px 22px;
    box-shadow: 0 2px 10px rgba(0,0,0,.06); display: flex; align-items: center; gap: 16px;
    border-top: 4px solid var(--accent);
  }
  .stat-card.green  { border-top-color: var(--success); }
  .stat-card.orange { border-top-color: var(--accent2); }
  .stat-card.red    { border-top-color: var(--danger); }
  .stat-card.blue   { border-top-color: var(--info); }
  .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-icon svg { width: 22px; height: 22px; }
  .stat-icon i { font-size: 22px; line-height: 1; }
  .stat-icon.teal   { background: rgba(38,218,210,.12); }
  .stat-icon.teal svg, .stat-icon.teal i { stroke: var(--accent); color: var(--accent); }
  .stat-icon.green  { background: rgba(46,204,113,.12); }
  .stat-icon.green svg, .stat-icon.green i { stroke: var(--success); color: var(--success); }
  .stat-icon.orange { background: rgba(245,166,35,.12); }
  .stat-icon.orange svg, .stat-icon.orange i { stroke: var(--accent2); color: var(--accent2); }
  .stat-icon.red    { background: rgba(231,76,60,.12); }
  .stat-icon.red svg, .stat-icon.red i { stroke: var(--danger); color: var(--danger); }
  .stat-icon.blue   { background: rgba(52,152,219,.12); }
  .stat-icon.blue svg, .stat-icon.blue i { stroke: var(--info); color: var(--info); }
  .stat-label { color: var(--text-muted); font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .8px; }
  .stat-value { font-size: 26px; font-weight: 700; color: #1a2035; line-height: 1.1; margin-top: 4px; }

  /* CARD */
  .card { background: var(--card-bg); border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,.06); margin-bottom: 24px; overflow: hidden; }
  .card-header { padding: 16px 22px; border-bottom: 1px solid #f0f2f5; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .card-title { font-size: 14.5px; font-weight: 700; color: #1a2035; }
  .card-body { padding: 22px; }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; padding: 11px 16px; text-align: left; border-bottom: 2px solid #e8ecf0; white-space: nowrap; }
  td { padding: 12px 16px; border-bottom: 1px solid #f0f4f8; color: #374151; font-size: 13px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }

  /* BADGES */
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: .4px; white-space: nowrap; }
  .badge-success  { background: rgba(46,204,113,.15);  color: #1a8a3d; }
  .badge-pending  { background: rgba(245,166,35,.15);  color: #a57800; }
  .badge-danger   { background: rgba(231,76,60,.15);   color: #c0392b; }
  .badge-info     { background: rgba(52,152,219,.15);  color: #1a6ea8; }
  .badge-active   { background: rgba(38,218,210,.15);  color: #0b8a83; }
  .badge-inactive { background: rgba(100,116,139,.15); color: #4b5563; }
  .badge-frozen   { background: rgba(99,102,241,.15);  color: #4338ca; }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all .18s; white-space: nowrap; }
  .btn svg { width: 14px; height: 14px; stroke: currentColor; flex-shrink: 0; }
  .btn-primary   { background: var(--accent);   color: #fff; }
  .btn-primary:hover { background: #1fbdb6; }
  .btn-danger    { background: var(--danger);   color: #fff; }
  .btn-danger:hover  { background: #c0392b; }
  .btn-success   { background: var(--success);  color: #fff; }
  .btn-success:hover { background: #27ae60; }
  .btn-warning   { background: var(--warning);  color: #fff; }
  .btn-warning:hover { background: #e67e22; }
  .btn-secondary { background: #64748b; color: #fff; }
  .btn-secondary:hover { background: #475569; }
  .btn-sm { padding: 5px 11px; font-size: 12px; }
  .btn-outline { background: transparent; border: 1.5px solid #cbd5e1; color: #4b5563; }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

  /* FORMS */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  label { font-size: 11.5px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: .5px; }
  input[type=text], input[type=email], input[type=password], input[type=number], select, textarea {
    border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 9px 13px;
    font-size: 13.5px; color: #2d3748; background: #fff;
    transition: border-color .2s; outline: none; width: 100%;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(38,218,210,.1); }
  textarea { min-height: 90px; resize: vertical; }

  /* ALERTS */
  .alert { padding: 12px 18px; border-radius: 8px; font-size: 13px; margin-bottom: 18px; }
  .alert-success { background: rgba(46,204,113,.1); color: #1a6a38; border: 1px solid rgba(46,204,113,.25); }
  .alert-danger  { background: rgba(231,76,60,.1);  color: #8b1a1a; border: 1px solid rgba(231,76,60,.25); }
  .alert-info    { background: rgba(52,152,219,.1); color: #1a3a6a; border: 1px solid rgba(52,152,219,.25); }

  /* PAGINATION */
  .pagination { display: flex; align-items: center; gap: 6px; padding: 16px 22px; justify-content: flex-end; border-top: 1px solid #f0f4f8; flex-wrap: wrap; }
  .page-link { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; padding: 0 8px; border-radius: 6px; font-size: 13px; text-decoration: none; color: #4b5563; border: 1px solid #e2e8f0; }
  .page-link:hover, .page-link.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  .page-info { color: var(--text-muted); font-size: 12px; margin-right: auto; }

  /* MODAL */
  .modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 200; align-items: center; justify-content: center; }
  .modal-backdrop.open { display: flex; }
  .modal { background: #fff; border-radius: 14px; padding: 28px; width: 90%; max-width: 540px; box-shadow: 0 20px 60px rgba(0,0,0,.2); max-height: 90vh; overflow-y: auto; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .modal-title { font-size: 16px; font-weight: 700; color: #1a2035; }
  .modal-close { background: none; border: none; cursor: pointer; color: #94a3b8; line-height: 1; padding: 4px; }
  .modal-close svg { width: 20px; height: 20px; stroke: currentColor; display: block; }
  .modal-close:hover { color: var(--danger); }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; padding-top: 16px; border-top: 1px solid #f0f4f8; }

  mark { background: rgba(38,218,210,.2); border-radius: 2px; padding: 0 2px; }
  code { background: #f1f5f9; border-radius: 4px; padding: 2px 6px; font-size: 12px; color: #475569; }
  .divider { border: none; border-top: 1px solid #f0f4f8; margin: 16px 0; }
  .search-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .search-input { flex: 1; max-width: 300px; }
</style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-brand">
    <div class="brand-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    </div>
    <span class="brand-name">XRT.LLC</span>
  </div>

  <div class="sidebar-profile">
    <div class="avatar-circle">ADM</div>
    <div class="profile-text">
      <div class="profile-name">Admin</div>
      <div class="profile-role">Administrator</div>
    </div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-label">Management</div>
    <?php foreach ($navItems as $key => $item): ?>
    <a class="nav-item <?= $currentPage === $key ? 'active' : '' ?>" href="<?= $item['href'] ?>">
      <div class="nav-link">
        <span class="nav-icon"><?= $navIcons[$key] ?></span>
        <span class="nav-label-text"><?= $item['label'] ?></span>
      </div>
      <span class="nav-tooltip"><?= $item['label'] ?></span>
    </a>
    <?php endforeach; ?>
  </nav>

  <div class="sidebar-footer">
    <a href="logout.php" class="logout-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      <span class="logout-text">Sign Out</span>
    </a>
  </div>
</aside>

<!-- MAIN -->
<div class="main-content">
  <header class="topbar">
    <div class="topbar-left">
      <button class="sidebar-toggle" id="sidebarToggle" title="Toggle sidebar" onclick="toggleSidebar()">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div class="topbar-title"><?= htmlspecialchars($pageTitle ?? 'Dashboard') ?></div>
    </div>
    <div class="topbar-right">
      <span class="topbar-date"><?= date('D, d M Y') ?></span>
      <div class="topbar-user">
        <div class="topbar-avatar">A</div>
        <span class="topbar-username">Admin</span>
      </div>
    </div>
  </header>
  <div class="page-content">

<script>
(function() {
  if (localStorage.getItem('sidebarMini') === '1') {
    document.body.classList.add('sidebar-mini');
  }
})();
function toggleSidebar() {
  document.body.classList.toggle('sidebar-mini');
  localStorage.setItem('sidebarMini', document.body.classList.contains('sidebar-mini') ? '1' : '0');
}
</script>

<!-- ── CUSTOM CONFIRM MODAL ──────────────────────────────────────────────── -->
<style>
@keyframes xrtPop {
  from { opacity:0; transform:scale(.92) translateY(8px); }
  to   { opacity:1; transform:scale(1)   translateY(0); }
}
#xrtConfirmBackdrop {
  display:none; position:fixed; inset:0;
  background:rgba(15,25,50,.6); backdrop-filter:blur(3px);
  z-index:9999; align-items:center; justify-content:center;
}
#xrtConfirmBackdrop.open { display:flex; }
#xrtConfirmBox {
  background:#fff; border-radius:18px; padding:28px 28px 24px;
  width:90%; max-width:400px;
  box-shadow:0 24px 70px rgba(0,0,0,.28);
  animation:xrtPop .18s cubic-bezier(.34,1.56,.64,1);
}
#xrtConfirmHead { display:flex; align-items:center; gap:14px; margin-bottom:14px; }
#xrtConfirmIconWrap {
  width:46px; height:46px; border-radius:13px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; font-size:21px;
}
#xrtConfirmTitle { font-size:15.5px; font-weight:800; color:#1a2035; }
#xrtConfirmMsg { font-size:13.5px; color:#4b5563; line-height:1.65; margin-bottom:24px; padding-left:60px; margin-top:-8px; }
#xrtConfirmFooter { display:flex; justify-content:flex-end; gap:10px; }
.xrt-btn-cancel {
  padding:9px 20px; border-radius:9px; font-size:13px; font-weight:700;
  cursor:pointer; border:1.5px solid #e2e8f0; background:#fff; color:#4b5563;
  transition:all .15s;
}
.xrt-btn-cancel:hover { background:#f8fafc; border-color:#cbd5e1; }
.xrt-btn-ok {
  padding:9px 22px; border-radius:9px; font-size:13px; font-weight:700;
  cursor:pointer; border:none; color:#fff; transition:all .15s; min-width:90px;
}
.xrt-btn-ok:hover { opacity:.88; }
</style>

<div id="xrtConfirmBackdrop">
  <div id="xrtConfirmBox">
    <div id="xrtConfirmHead">
      <div id="xrtConfirmIconWrap"></div>
      <div id="xrtConfirmTitle"></div>
    </div>
    <div id="xrtConfirmMsg"></div>
    <div id="xrtConfirmFooter">
      <button class="xrt-btn-cancel" id="xrtConfirmCancelBtn">Cancel</button>
      <button class="xrt-btn-ok"     id="xrtConfirmOkBtn">Confirm</button>
    </div>
  </div>
</div>

<script>
(function () {
  let _resolve = null;

  const backdrop  = document.getElementById('xrtConfirmBackdrop');
  const titleEl   = document.getElementById('xrtConfirmTitle');
  const msgEl     = document.getElementById('xrtConfirmMsg');
  const iconWrap  = document.getElementById('xrtConfirmIconWrap');
  const okBtn     = document.getElementById('xrtConfirmOkBtn');
  const cancelBtn = document.getElementById('xrtConfirmCancelBtn');

  const themes = {
    danger  : { bg:'rgba(231,76,60,.12)',  icon:'🗑️',  title:'Are you sure?',   ok:'#e74c3c' },
    warning : { bg:'rgba(245,158,11,.12)', icon:'⚠️',  title:'Confirm action',  ok:'#f59e0b' },
    success : { bg:'rgba(46,204,113,.12)', icon:'✅',  title:'Confirm action',  ok:'#2ecc71' },
    info    : { bg:'rgba(52,152,219,.12)', icon:'ℹ️',  title:'Confirm action',  ok:'#3498db' },
  };

  function close(result) {
    backdrop.classList.remove('open');
    if (_resolve) { const r = _resolve; _resolve = null; r(result); }
  }

  okBtn.addEventListener('click',     () => close(true));
  cancelBtn.addEventListener('click', () => close(false));
  backdrop.addEventListener('click',  (e) => { if (e.target === backdrop) close(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(false); });

  window.xrtConfirm = function(msg, onConfirm, type) {
    type = type || 'warning';
    const t = themes[type] || themes.warning;
    iconWrap.textContent      = t.icon;
    iconWrap.style.background = t.bg;
    titleEl.textContent       = t.title;
    msgEl.textContent         = msg;
    okBtn.style.background    = t.ok;
    backdrop.classList.add('open');
    okBtn.focus();
    _resolve = (confirmed) => { if (confirmed && onConfirm) onConfirm(); };
  };

  /* ── Global handler: buttons with data-confirm ── */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-confirm]');
    if (!btn || btn.tagName === 'FORM') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const msg  = btn.dataset.confirm;
    const ctype = btn.dataset.confirmType || 'warning';
    xrtConfirm(msg, () => {
      const form = btn.closest('form');
      if (!form) return;
      if (btn.name && btn.value) {
        let inp = form.querySelector('input._xrt_btn[name="' + btn.name + '"]');
        if (!inp) {
          inp = document.createElement('input');
          inp.type = 'hidden'; inp.className = '_xrt_btn';
          inp.name = btn.name; form.appendChild(inp);
        }
        inp.value = btn.value;
      }
      form.submit();
    }, ctype);
  }, true);

  /* ── Global handler: forms with data-confirm ── */
  document.addEventListener('submit', function (e) {
    const form = e.target;
    const msg  = form.dataset.confirm;
    if (!msg) return;
    if (form._xrtOk) { form._xrtOk = false; return; }
    e.preventDefault();
    xrtConfirm(msg, () => { form._xrtOk = true; form.submit(); },
      form.dataset.confirmType || 'warning');
  }, true);

})();
</script>
