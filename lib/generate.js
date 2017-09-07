#!/usr/bin/env node
var fs = require('fs');
const readline = require('readline');
const kbet = require('./kbet');
var Writable = require('stream').Writable;
var mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
        if (!this.hidden) {
            process.stdout.write(chunk, encoding);
        } else {
            // let backspace = new Buffer([0x1b, 0x5b, 0x31, 0x47]);
            // let ignore = 0;
            // if (chunk.toString() === backspace.toString()) {
            //     //console.log("---- BACKSPACE DDALA RE")
            //     ignore = 3;
            //     //process.stdout.write(chunk, encoding);
            // } else if(ignore > 0){
            //     ignore--;
            // } 
            // else {
            //     //process.stdout.write(new Buffer("*"), encoding);
            // }
            //console.log(chunk)
        }
        callback();
    }
});
mutableStdout.hidden = false;

let kv = {
    create: {
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
                    q: "Please speify an Entry Process id?",
                    key: 'entry',
                    d: "1.0"
                },
            ];

            // list.reduce((accumulator, newItem, index) => {
            //     return accumulator.then(didntAnswer => {
            //         if (!didntAnswer) {
            //             // did answer
            //             return accumulator.then(promisify(newItem));
            //         } else {
            //             list.splice(index, 0, didntAnswer.item);
            //             return accumulator.then(promisify(didntAnswer.item));
            //         }
            //     });
            // }, Promise.resolve()).then(done => {
            //     console.log('-------------\n\n Created app: ', appPackageManifest);
            //     rl.close();
            // }).catch(err => {
            //     console.log('Some issue: ', err);
            //     rl.close();
            // });

            let chain = promisify(list[0]);
            let index = 0;
            function fresolve() {
                console.log('-------------\n\n Created app: ', appPackageManifest);
                fs.mkdirSync(appPackageManifest.name);
                fs.writeFileSync("./" + appPackageManifest.name + "/package.manifest.json", JSON.stringify(appPackageManifest, null, 4), 'utf8');
                kv.add.process(appPackageManifest.entry, appPackageManifest.name);
                fs.mkdirSync(appPackageManifest.name+'/Application');
                let fromDir = __dirname + '/looks/A/';
                let moduleFile = fs.readFileSync(fromDir+'/module.k.js', 'utf8');
                fs.writeFileSync(appPackageManifest.name+'/Application/module.k.js',
                    moduleFile
                    , 'utf8');
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
    },
    add: {
        model: function (name) {
            let appPackage = JSON.parse(fs.readFileSync('./package.manifest.json'));
            appPackage.models = appPackage.models || {};
            if (!appPackage.models.hasOwnProperty(name)) {
                appPackage.models[name] = {
                    "modelName": name,
                    "WriteFormat": {
                        "name": "string",
                        "activated": "boolean",
                        "sample": {
                            "s1": "number",
                            "s2": "string"
                        }
                    },
                }
                fs.writeFileSync("./package.manifest.json", JSON.stringify(
                    appPackage
                    , null, 4), 'utf8');
                console.log('Created successfully');
            } else {
                console.log('The model already present: ' + name);
            }
        },
        process: function (name, appDir) {
            let path = process.cwd();
            if (appDir) {
                path = path + '/' + appDir;
            }
            let dirname = path + '/P' + name;
            let fromDir = __dirname + '/looks/P/';
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
                            console.log('created process : ', name, ' in ', process.cwd());
                        });
                    }
                });
            } else {

                console.log('process ' + name + ' present already');
            }
        },
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
                q: "give your app a process ref (unique string in amongst all your apps REGEX: a-zA-Z0-9_- )",
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
            let appPackage = JSON.parse(fs.readFileSync('./package.manifest.json'));
            app.name = appPackage.name;
            app.location = process.cwd();
            kbet.createAppInRemote(app, (response) => {
                appPackage.pref = app.pref;
                appPackage.location = response.location;
                appPackage.id = response._id;
                fs.writeFileSync("./package.manifest.json", JSON.stringify(
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
    push: function () {
        let appPackage = JSON.parse(fs.readFileSync('./package.manifest.json'));
        kbet.reloadApp(appPackage.id);
    },

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