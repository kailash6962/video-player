module.exports = {
  apps: [{
    name: 'video-player',
    script: 'server.js',

    // Basic settings
    instances: 1,
    exec_mode: 'fork',

    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 5555,
      VIDEO_DIR: '/var/lib/qbittorrent/Downloads'
    },

    env_production: {
      NODE_ENV: 'production',
      PORT: 5555,
      VIDEO_DIR: '/var/lib/qbittorrent/Downloads'
    },

    // Restart settings
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000,

    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Advanced settings
    min_uptime: '10s',
    max_restarts: 10,

    // Source control
    ignore_watch: [
      'node_modules',
      'databases',
      'logs',
      '.git'
    ]
  }]
};
