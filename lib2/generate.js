#!/usr/bin/env node
require('./utils');
kv = {
    create: {
        workspace: require('./create/workspace'),
        app: require('./create/app'),
        model: function (name) {

        },
        service: function () {

        },
        task: function () {

        },
        channel: function () {

        },
    },
    add: {
        'model': function (name) {

        },
        'activity': function (name, appDir, isBasicTemplate) {
            let path = process.cwd();
            if (appDir) {
                path = path + '/' + appDir;
            }
            let dirname = path + '/P-' + name;
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
        'ba': function (name) {
            kv.add.activity(name, null, false);
        },
        'a': function (name) {
            kv.add.activity(name, null, true);
        }
    },
    auth: cb => {
        //var path = (workspaceName ? './' + workspaceName : '.') + "/auth.k.json";
        var path = "./.auth.k.json";
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
                        //console.log(`\nGot the password! moving ahead`);
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
                        //console.log(`\n${item.key}: ${answer}\n`);
                    });
                }
            })
        }
        let list = [
            {
                q: "Enter your KBET username",
                key: 'userId',
                d: false
            },
            {
                q: "Enter the KBET Password",
                key: 'password',
                d: false
            },
        ];
        let chain = promisify(list[0]);
        let index = 0;
        function fresolve() {
            rl.close();
            kbet.login(auth, (token) => {
                delete auth.password;
                delete auth;
                //console.log(body);
                fs.writeFileSync(path, JSON.stringify({
                    userId: auth.userId.substring(0, 3) + "...",
                    token: token
                }, null, 4), 'utf8');
                console.log('Auth Successfull'.green)
                console.log('-------------');
                if (cb) { cb(token) }
            });
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
    deploy: cb => {
        kbet.deploy(getRepo().repoName, (resp) => { console.log('[Done]'.green) });
    },
    reload: cb => {
        kbet.reload(getRepo().repoName, (resp) => { console.log('[Done]'.green) });
    },
    gitpush: cb => {
        exec('git add . && git commit -m "Commit from Kennect Cli" && git push origin master',
            function (error, stdout, stderr) {
                if (!error) {
                    console.log(stdout);
                } else {
                    console.log(error);
                    console.log(stderr);
                }
            });
    }
}
module.exports = kv;

if (process.argv.length == 5) {
    let command = process.argv[2];
    if (command == 'add') {
        let name = process.argv[4].toString();
        let thing = process.argv[3];
        kv.add[thing](name);
    }
} else if (process.argv.length == 4) {
    let command = process.argv[2];
    let thing = process.argv[3];
    if (kv.hasOwnProperty(command)) {
        kv[command][thing]();
    }
} else if (process.argv.length == 3) {
    let command = process.argv[2];
    switch (command) {
        case 'init': {
            kv.create['app']();
            break;
        }
        default: {
            kv[command]();
        }
    }
}
process.on('unhandledRejection', error => {
    console.log('unhandledRejection : ', error);
});


/* scrape code */
// if (stdout !== '') {
//     console.log('---------stdout: ---------\n' + stdout);
// }
// if (stderr !== '') {
//     console.log('---------stderr: ---------\n' + stderr);
// }
// if (error !== null) {
//     console.log('---------exec error: ---------\n[' + error + ']');
// }