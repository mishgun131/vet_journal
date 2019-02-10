module.exports = function() {
    switch(process.env.NODE_ENV){
        case 'production':
            return {
                port: 80,
                postgres: {
                    user: 'login',
                    host: 'host',
                    database: 'vet',
                    password: 'password',
                    port: 5432
                },
                debug: false,
                cookieSecret: 'SomeSecret'
            };
        case 'development':
        default:
            return {
                port: 3000,
                postgres: {
                    user: 'login',
                    host: 'host',
                    database: 'vet',
                    password: 'password',
                    port: 5432
                },
                debug: true,
                cookieSecret: 'SomeSecret'
            };
    }
};