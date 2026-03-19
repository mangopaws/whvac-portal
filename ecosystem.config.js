/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "whvac-portal",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: "/var/www/whvac-portal",

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        HOSTNAME: "0.0.0.0",
      },

      // Process management
      instances: 1,           // Single instance (SQLite isn't multi-process safe)
      exec_mode: "fork",      // fork mode required for single instance + SQLite
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Logging
      out_file: "/var/log/pm2/whvac-portal.out.log",
      error_file: "/var/log/pm2/whvac-portal.error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Restart delay on crash
      restart_delay: 3000,
      min_uptime: "5s",
      max_restarts: 10,
    },
  ],
};
