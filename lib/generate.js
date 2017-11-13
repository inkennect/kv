#!/usr/bin/env node
var fs = require('fs');
const readline = require('readline');
const kbet = require('./kbet');
var Writable = require('stream').Writable;
var mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
        if (!this.hidden) {
            process.stdout.write(chunk, encoding);
        }
        callback();
    }
});

mutableStdout.hidden = false;

let kv = {
    create: {
        workspace: function (name) {
        },
        app: function (name) {
            let appPackageManifest = {};
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            let promisify = item => {
                return new Promise((res, rej) => {
                    rl.question(item.q + (item.d ? '(' + item.d + ')?: ' : '?: '), (answer) => {
                        answer = answer == '' ? item.d : answer;
                        if (!answer) {
                            res({ message: 'missing answer', item: item });
                        } else {
                            appPackageManifest[item.key] = answer;
                            res(false);
                        }
                        console.log(`\n${item.key}: ${answer}\n`);
                        //rl.close();
                    });
                })
            }
            let list = [
                {
                    q: "Name for the application?",
                    key: 'name',
                    d: false
                },
                {
                    q: "Template: Basic or Blank? (Enter 1 for Basic, 2 for Blank)",
                    key: 'isBasicTemplate',
                    d: '1'
                },
                {
                    q: "Please speify an Entry activity id?",
                    key: 'entry',
                    d: "1.0"
                },
            ];

            let chain = promisify(list[0]);
            let index = 0;
            function fresolve() {
                console.log('-------------\n\n Created app: ', appPackageManifest);
                fs.mkdirSync(appPackageManifest.name);
                const isBasicTemplate = appPackageManifest.isBasicTemplate;
                delete appPackageManifest.isBasicTemplate;
                appPackageManifest.type = "application";
                fs.writeFileSync("./" + appPackageManifest.name + "/manifest.json", JSON.stringify(appPackageManifest, null, 4), 'utf8');
                kv.add.activity(appPackageManifest.entry, appPackageManifest.name, isBasicTemplate != '2');
                fs.mkdirSync(appPackageManifest.name + '/Application');
                let fromDir = __dirname + (isBasicTemplate == '2' ? '/looks/A-blank/' : '/looks/A-basic/');
                let moduleFile = fs.readFileSync(fromDir + '/module.k.js', 'utf8');
                fs.writeFileSync(appPackageManifest.name + '/Application/module.k.js', moduleFile, 'utf8');
                rl.close();
            }
            let reducer = didntAnswer => {
                index++;
                if (index == list.length) {
                    fresolve();
                } else {
                    if (!didntAnswer) {
                        // did answer
                        chain.then(promisify(list[index]).then(reducer));
                    } else {
                        list.splice(index, 0, didntAnswer.item);
                        chain.then(promisify(didntAnswer.item).then(reducer));
                    }
                }
            }
            chain.then(reducer)
        },
        model: function (name) {

        },
        service: function (name) {

        },
        task: function (name) {

        },
        channel: function (name) {

        },
    },
    add: {
        model: function (name) {
            let appPackage = JSON.parse(fs.readFileSync('./app.manifest.json'));
            appPackage.models = appPackage.models || {};
            if (!appPackage.models.hasOwnProperty(name)) {
                appPackage.models[name] = {
                    "modelName": name,
                    "access": "rw"
                }
                fs.writeFileSync("./app.manifest.json", JSON.stringify(
                    appPackage
                    , null, 4), 'utf8');
                console.log('Created successfully');
            } else {
                console.log('The model already present: ' + name);
            }
        },
        activity: function (name, appDir, isBasicTemplate) {
            let path = process.cwd();
            if (appDir) {
                path = path + '/' + appDir;
            }
            let dirname = path + '/P' + name;
            let fromDir = __dirname + (isBasicTemplate ? '/looks/P-basic/' : '/looks/P-blank/');
            //var dirname = path.dirname(path);
            if (!fs.existsSync(dirname)) {
                fs.mkdirSync(dirname);
                fs.readdir(fromDir, (err, list) => {
                    if (err) {
                        console.error("Issue in readDir ", err);
                    } else {
                        let promises = [];
                        for (let item of list) {
                            promises.push(new Promise((res, rej) => {
                                fs.readFile(fromDir + item, 'utf8', function (err, data) {
                                    if (err) {
                                        return rej(err);
                                    }
                                    let result = data;
                                    if (item == 'manifest.json') {
                                        result = result.replace(/__activityId__/g, name);
                                        result = result.replace(/__procid__/g, "P" + name);
                                    }
                                    fs.writeFile(dirname + '/' + item, result, 'utf8', function (err) {
                                        if (err) return rej(err);
                                        res();
                                    });
                                });
                            }));
                        }
                        Promise.all(promises).then(() => {
                            console.log('created activity : ', name, ' in ', process.cwd());
                        });
                    }
                });
            } else {

                console.log('activity ' + name + ' present already');
            }
        },
        'bpa': function (name) {
            kv.add.activity(name, null, false);
        },
        'pa': function (name) {
            kv.add.activity(name, null, true);
        }
    },
    auth: function () {
        let auth = {};
        const rl = readline.createInterface({
            input: process.stdin,
            output: mutableStdout,
            terminal: true
        });
        let promisify = item => {
            return new Promise((res, rej) => {
                let question = item.q + (item.d ? '(' + item.d + ')?: ' : '?: ');
                if (item.key == 'password') {
                    console.log(question);
                    mutableStdout.hidden = true;
                    rl.on('line', answer => {
                        answer = answer == '' ? item.d : answer;
                        if (!answer) {
                            res({ message: 'missing answer', item: item });
                        } else {
                            auth[item.key] = answer;
                            res(false);
                        }
                        console.log(`\n Got the password! moving ahead\n`);
                        mutableStdout.hidden = false;
                    })
                } else {
                    rl.question(question, (answer) => {
                        answer = answer == '' ? item.d : answer;
                        if (!answer) {
                            res({ message: 'missing answer', item: item });
                        } else {
                            auth[item.key] = answer;
                            res(false);
                        }
                        console.log(`\n${item.key}: ${answer}\n`);
                    });
                }
            })
        }
        let list = [
            {
                q: "Enter the userId",
                key: 'userId',
                d: false
            },
            {
                q: "Enter the Password",
                key: 'password',
                d: false
            },
        ];
        let chain = promisify(list[0]);
        let index = 0;
        function fresolve() {
            console.log('\n-------------\n');
            rl.close();
            kbet.login(auth, (token) => {
                delete auth.password;
                delete auth;
                //console.log(body);
                fs.writeFileSync("./auth.k.json", JSON.stringify({
                    userId: auth.userId.substring(0, 3) + "...",
                    token: token
                }, null, 4), 'utf8');
                console.log('Successfull')
            })
        }
        let reducer = didntAnswer => {
            index++;
            if (index == list.length) {
                fresolve();
            } else {
                if (!didntAnswer) {
                    // did answer
                    chain.then(promisify(list[index]).then(reducer));
                } else {
                    list.splice(index, 0, didntAnswer.item);
                    chain.then(promisify(didntAnswer.item).then(reducer));
                }
            }
        }
        chain.then(reducer);
    },
    register: function () {
        let app = {};
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        let promisify = item => {
            return new Promise((res, rej) => {
                let question = item.q + (item.d ? '(' + item.d + ')?: ' : '?: ');
                rl.question(question, (answer) => {
                    answer = answer == '' ? item.d : answer;
                    if (!answer) {
                        res({ message: 'missing answer', item: item });
                    } else {
                        app[item.key] = answer;
                        res(false);
                    }
                    console.log(`\n${item.key}: ${answer}\n`);
                });
            })
        }
        let list = [
            {
                q: "give your app a activity ref (unique string in amongst all your apps REGEX: a-zA-Z0-9_- )",
                key: 'pref',
                d: false,
                //regex:/^[a-zA-Z0-9_-]*$/
            }
        ];
        let chain = promisify(list[0]);
        let index = 0;
        function fresolve() {
            console.log('\n-------------\n');
            rl.close();
            let appPackage = JSON.parse(fs.readFileSync('./app.manifest.json'));
            app.name = appPackage.name;
            app.location = process.cwd();
            kbet.createAppInRemote(app, (response) => {
                appPackage.pref = app.pref;
                appPackage.location = response.location;
                appPackage.id = response._id;
                fs.writeFileSync("./app.manifest.json", JSON.stringify(
                    appPackage
                    , null, 4), 'utf8');
                console.log('Created successfully');
            });
        }
        let reducer = didntAnswer => {
            index++;
            if (didntAnswer) {
                // did not answer
                list.splice(index, 0, didntAnswer.item);
                chain.then(promisify(didntAnswer.item).then(reducer));
            } else if (index == list.length) {
                fresolve();
            } else {
                // did answer
                chain.then(promisify(list[index]).then(reducer));
            }
        }
        chain.then(reducer);
    },
    push_old: function () {
        let appPackage = JSON.parse(fs.readFileSync('./app.manifest.json'));
        kbet.reloadApp(appPackage.id);
    },
    push: function () {

    }
}
module.exports = kv;

if (process.argv.length == 5) {
    let command = process.argv[2];
    let thing = process.argv[3];
    let name = process.argv[4].toString();
    if (kv.hasOwnProperty(command)) {
        kv[command][thing](name);
    }
}

if (process.argv.length == 3) {
    let command = process.argv[2];
    switch (command) {
        case 'init': {
            kv.create['app']();
            break;
        }
        case 'auth': {
            kv.auth();
            break;
        }
        case 'register': {
            kv.register();
            break;
        }
        case 'push': {
            kv.push();
            break;
        }
    }
}
process.on('unhandledRejection', error => {
    console.log('unhandledRejection : ', error);
});