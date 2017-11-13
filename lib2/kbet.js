let request = require("request");
var fs = require('fs');
let config = require('./config.js');
const getAuth = function () {
    let path = './auth.k.json';
    if (!fs.statSync(path)) {
        console.error("auth not done yet, please initialize the workspace wih kc create workspace or kc auth")
        process.exit();
    } else {
        return fs.readFileSync(path);
    }
}

module.exports = {
    login: (auth, cb) => {
        let options = {
            method: 'POST',
            url: config.baseUrl + '/common/v0.1/login',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json'
            },
            body: { username: auth.userId, password: auth.password },
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
    /* loadAppInRemote: (appId, package) => {
        let authToken = JSON.parse(getAuth());
        let options = {
            method: 'PUT',
            url: config.baseUrl + '/tenant/v0.1/app/load',
            headers: {
                'content-type': 'application/json',
                'Authorization': authToken.token
            },
            body: {
                id: appId
            },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) {
                console.error('network issue, can\'t reach the KBET Server');
                throw new Error(error);
            } else {
                if (body.ok) {
                    console.log(body);
                    console.log('Reloaded the app.')
                } else {
                    console.log('Failure: ' + body.message);
                }
            }
        });
    }, */
    getMyApps: (cb) => {
        let auth = JSON.parse(getAuth());
        let options = {
            method: 'GET',
            url: config.baseUrl + '/tenant/v0.1/apps',
            headers: {
                'content-type': 'application/json',
                'Authorization': auth.token
            },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) {
                console.error('network issue, can\'t reach the KBET Server');
                throw new Error(error);
            } else {
                if (body.ok) {
                    console.log(JSON.stringify(body, null, 4));
                } else {
                    console.log('Failure: ' + body.message);
                }
            }
        });
    },
    /* creation */
    createWorkspace: (token, repository, cb) => {
        let options = {
            method: 'POST',
            url: config.baseUrl + '/tenant/v0.1/workspace',
            headers: {
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'Authorization': token
            },
            body: repository,
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
    createAppInRemote: (body, cb) => {
        let auth = JSON.parse(getAuth());
        let options = {
            method: 'POST',
            url: config.baseUrl + '/tenant/v0.1/app',
            headers: {
                'content-type': 'application/json',
                'Authorization': auth.token
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

}