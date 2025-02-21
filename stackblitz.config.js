module.exports = {
  installDependencies: true,
  startCommand: "npm run dev",
  env: {
    NODE_ENV: 'development'
  },
  buildCommand: "npm run build",
  settings: {
    compile: {
      trigger: 'auto',
      clearConsole: false
    }
  }
}; 