module.exports = function() {
    switch(process.env.NODE_ENV){
        case 'production':
            return {
                port: 80,
                connectString: "postgres://login:password@host:port/vet",
                debug: false,
                cookieSecret: 'SomeSecret'
            };
        case 'development':
        default:
            return {
                port: 3000,
                connectString: "postgres://login:password@host:port/vet",
                debug: true,
                cookieSecret: 'SomeSecret'
            };
    }
};