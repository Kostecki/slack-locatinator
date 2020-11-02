module.exports = {
  apps: [
    {
      name: 'Slack Locatinator (API)',
      script: 'npm',
      args: "start",
      watch: true,
      env: {
        NODE_ENV: 'production',
        port: 3000,
      }
    }
  ]
}