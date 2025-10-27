const fs = require('fs')
const path = require('path')

const handleArgs = (args) => {
  if (args === undefined) {
    return undefined
  }

  if (typeof args === 'string') {
    args = args.trim()
    return args === '' ? undefined : args
  }

  if (Array.isArray(args)) {
    args = args.map(arg => arg.trim())
    return args.length === 0 ? undefined : args
  }

  throw new Error('Invalid args')
}

const apps = fs.readdirSync('./apps')
  .map(app => path.join(__dirname, 'apps', app))
  .filter(app => fs.statSync(app).isDirectory())
  .map(app => {
    const serviceFile = path.join(app, 'service.json')
    return !fs.existsSync(serviceFile)
      ? null
      : {
        absPath: app,
        service: JSON.parse(fs.readFileSync(serviceFile, 'utf-8')),
      }
  })
  .filter(app => app !== null)
  .map(app => {
    const {
      name = path.basename(app.absPath),
      script = 'src/index.ts',
      interpreter_args = '--import @swc-node/register/esm-register',
      interpreter = process.execPath,
      cwd = app.absPath,
      autorestart = true,
      args,
    } = app.service

    const service = {
      name,
      script,
      interpreter,
      interpreter_args,
      cwd,
      autorestart,
      args: handleArgs(args),
      env: {
        name: undefined
      },
      env_production: {
        name: undefined,
      },
    }

    return service
  })

module.exports = { apps }
