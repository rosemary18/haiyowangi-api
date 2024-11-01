const Hapi = require('@hapi/hapi')
const Inert = require('@hapi/inert')
const Jwt = require('@hapi/jwt')
const Path = require('path')
const routes = require('../routes')
const socket = require('./socket')
const db = require('./db')
const { jwtStrategy } = require('./middlewares')
const cronjobs = require('./cronjobs')

// Hapi configurations
const configHapi = {
    port: process.env.PORT || 9090,
    host: process.env.HOST || "0.0.0.0",
    routes: {
        cors: { origin: ['*'] },
        files: {
            relativeTo: Path.join(__dirname, '../public')
        }
    },
    router: {
        stripTrailingSlash: true
    },
}

const server = async () => {

    // Apply configurations
    const app = Hapi.server(configHapi)
    await app.register([Inert, Jwt])
    app.route(routes)
    jwtStrategy(app)

    // Start services
    await app
        .start()
        .then(() => console.log(`[APP]: Service available on ${app.info.uri}, lets rock n roll ...`))
        .catch((err) => console.log(`Service failed to start... \n ${err}`))
    
    // Listen socket
    socket.listenSocket(app);

    // Sync database
    await db.sync()
    .then(() => console.log('[DB]: Database synced...'))
    .catch((error) => console.error('[DB]: Database connection failed:', error));

    // Running cronjobs
    cronjobs(app);
}

module.exports = server