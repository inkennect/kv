let request = require("request");
var fs = require('fs');

module.exports = {
    login: (auth, cb) => {
        let options = {
            method: 'POST',
            url: 'http://localhost:1337/common/v0.1/login',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json'
            },
            body: { email: auth.userId, password: auth.password },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) {
                console.error('network issue, can\'t reach the KBET Server');
                throw new Error(error);
            } else {
                if (body.ok) {
                    cb(body.token);
                } else {
                    console.log('Failure: ' + body.message);
                }
            }
        });
    },
    createAppInRemote: (body,cb) => {
        let authToken = JSON.parse(fs.readFileSync('../auth.k.json'));
        let options = {
            method: 'POST',
            url: 'http://localhost:1337/apps/v0.1/create',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'auth': authToken.token
            },
            body: body,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) {
                console.error('network issue, can\'t reach the KBET Server');
                throw new Error(error);
            } else {
                if (body.ok) {
                    cb(body.app);
                } else {
                    console.log('Failure: ' + body.message);
                }
            }
        }); 
    },
    reloadApp: (appId) => {
        let authToken = JSON.parse(fs.readFileSync('../auth.k.json'));
        let options = {
            method: 'PUT',
            url: 'http://localhost:1337/apps/v0.1/reload',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'auth': authToken.token
            },
            body: {
                id:appId
            },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) {
                console.error('network issue, can\'t reach the KBET Server');
                throw new Error(error);
            } else {
                if (body.ok) {
                    console.log('Reloaded the app.')
                } else {
                    console.log('Failure: ' + body.message);
                }
            }
        }); 
    },

}