{pkgs}: {
  deps = [
    pkgs.php83Extensions.pgsql
    pkgs.php83Extensions.pdo_pgsql
    pkgs.php83Extensions.pdo
    pkgs.php83
    pkgs.unzip
  ];
}
