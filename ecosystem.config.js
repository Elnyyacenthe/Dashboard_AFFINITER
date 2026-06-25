module.exports = {
  apps: [
    {
      name: "affiniter-dashboard",
      cwd: "/var/www/affiniter-dashboard",
      script: "node_modules/.bin/next",
      args: "start -p 3100",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3100",
      },
      error_file: "/var/log/pm2/affiniter-dashboard-error.log",
      out_file: "/var/log/pm2/affiniter-dashboard-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
