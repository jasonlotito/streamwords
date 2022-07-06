module.exports = {
    apps: [{
        name: 'streamwords',
        script: './server.js',
        env_production: {
            PORT: 4000
        },
        env_development: {
            PORT: 3000
        }
    }]
}
