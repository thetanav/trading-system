module.exports = {
    apps: [{
        name: 'trading-system-backend',
        script: 'dist/index.js',
        instances: 'max', // Use all CPU cores
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production'
        }
    }]
};