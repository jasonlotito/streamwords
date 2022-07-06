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
    }],
    deploy: {
        production: {
            "user": "ec2-user",
            "key": "/mnt/c/Users/jason/.ssh/LightsailDefaultKey-us-east-1.pem",
            "host": ["damnscout.com"],
            "ref": "origin/master",
        }
    }
}
