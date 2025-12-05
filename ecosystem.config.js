module.exports = {
  apps: [
    {
      name: 'gestion-commerciale',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/ghostapp/gestion-commerciale',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/www/ghostapp/gestion-commerciale/logs/pm2-error.log',
      out_file: '/var/www/ghostapp/gestion-commerciale/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      // Redémarrer automatiquement en cas de crash
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Ignorer les erreurs de connexion à la base de données (redémarrera quand même)
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ]
};

