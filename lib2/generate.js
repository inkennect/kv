#!/usr/bin/env node
var fs = require('fs');
var colors = require('colors')

const readline = require('readline');
const kbet = require('./kbet');
const Writable = require('stream').Writable;
const mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
        if (!this.hidden) {
            process.stdout.write(chunk, encoding);
        }
        callback();
    }
});
mutableStdout.hidden = false;
let question = (qstn) => new Promise((s, j) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    //console.log(qstn)
    // rl.on('line', function (answer) {
    //     //console.log('You just typed: ' + answer);
    //     s(answer)
    // });
    rl.question(qstn, (answer) => {
        s(answer);
        rl.close();
    });
});

let kv = {
    create: {
        workspace: async function () {
            let hasRepo = (await question("Have you created a BitBucket/Github Private repository ? (Y || N)")).toLowerCase();
            if (hasRepo != "y" && hasRepo != "yes") {
                console.log("Workspace not created. \n Please create a Bitbucket/ github repo first. (refer to the guide https://bet.kennect.xyz/guide/workspace )");
                process.exit();
            }
            let gitHost = await question("Enter 1 for bitbucket.org, 2 for github.com: ");
            if (gitHost == 1) {
                gitHost = 'bitbucket.org';
            } else if (gitHost == 2) {
                gitHost = 'github.com';
            } else {
                console.log("Git remote must be from github.com or bitbucket.org".red);
                process.exit();
            }
            let repoName = await question("Enter the full name of the repo: ( ex. username/repository )");
            if (repoName.split('.git').length == 1) {
                repoName = repoName.split('.git')[0];
            }
            let name = repoName.split('/')[1];
            if (!name) {
                console.log("Invalid name of the repo, it should be like username/repository ".red);
                process.exit();
            }
            const remoteUrl = 'https://' + (gitHost === 'bitbucket.org' ? repoName.split('/')[0] + "@" : '') + gitHost + '/' + repoName + '.git';
            /* creating the workspace */
            console.log('Creating directories '.green);
            try {
                fs.mkdirSync(name);
            } catch (err2) {
                if (/already exists/.test(err2.toString())) {
                    console.log('[Error]: this directory already exists. please remove or try creating a workspace in other directory.')
                    process.exit();
                }
            }
            process.chdir(name);
            fs.writeFileSync('./.gitignore', "auth.k.json\n")
            fs.writeFileSync('./workspace.json', JSON.stringify({ repoName, createdOn: new Date().getTime() }, null, 4))

            fs.mkdirSync('Apps');
            fs.writeFileSync('Apps/.gitkeep', "");

            fs.mkdirSync('Services');
            fs.writeFileSync('Services/.gitkeep', "");

            fs.mkdirSync('Channels');
            fs.writeFileSync('Channels/.gitkeep', "");

            fs.mkdirSync('Models');
            fs.writeFileSync('Models/.gitkeep', "");

            fs.mkdirSync('Tasks');
            fs.writeFileSync('Tasks/.gitkeep', "");

            console.log('[DONE]\nAuthenticating you '.green);
            /* authenticating the user */
            kv.auth(token => {
                /* letting the server know this workspace is created */
                console.log('[DONE]\nCreating workspace '.green);
                kbet.createWorkspace(token, {
                    gitHost,
                    repoName,
                    remoteUrl
                }, () => {
                    console.log('[DONE]\nCreating a local git repository and adding remote as origin'.green)
                    const exec = require('child_process').exec;
                    const child = exec('git init && git remote add origin ' + remoteUrl + ' && git add . && git commit -m "initialized kbet workspace" ',
                        function (error, stdout, stderr) {
                            if (stdout !== '') {
                                console.log('------------------\n' + stdout + '\n ------------------');
                            }
                            if (error) {
                                console.log(error);
                                console.log(`ERROR [Manually Fixable]: Could not create git repo in the directory. \nPlease do the following : 
                                    \n cd ${name} && git init && git remote add origin ${remoteUrl} && git push -u origin master  \n`.red);
                            } else {
                                console.log('[DONE]'.green);
                                console.log('Workspace created and registered successfully.'.black.bgYellow)
                            }
                            console.log('\n** Please enter into your workspace by '.black.bgGreen + "cd ".black.bgYellow + name.black.bgYellow +
                                ' and do '.black.bgGreen + 'git push -u origin master'.black.bgYellow +
                                ' before starting to use farther Kbet-Cli commands.'.black.bgGreen);
                            console.log(`** Please 'git push --set-upstream origin master' to the remote repository to deploy the code in KBET`.black.bgYellow);
                            console.log(`** Please make sure the repository is private`.black.bgGreen);
                        });
                });
            });
        },
        app: function () {
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
                    });
                })
            }
            let list = [
                {
                    q: "Name for the application? ",
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
                {
                    q: "give your app an activity ref (unique string in amongst all your apps REGEX: a-zA-Z0-9_- )",
                    key: 'pref',
                    d: false
                }
            ];

            let chain = promisify(list[0]);
            let index = 0;
            function fresolve() {
                rl.close();
                kbet.createAppInRemote(appPackageManifest, (response) => {

                    console.log('-------------\n\n Created app: ', appPackageManifest);

                    process.chdir('./Apps');

                    fs.mkdirSync(appPackageManifest.name);
                    const isBasicTemplate = appPackageManifest.isBasicTemplate;
                    delete appPackageManifest.isBasicTemplate;
                    appPackageManifest.id = response._id;
                    appPackageManifest.type = "application";
                    fs.writeFileSync("./" + appPackageManifest.name + "/manifest.json", JSON.stringify(appPackageManifest, null, 4), 'utf8');

                    kv.add.activity(appPackageManifest.entry, appPackageManifest.name, isBasicTemplate != '2');

                    fs.mkdirSync(appPackageManifest.name + '/Application');
                    let fromDir = __dirname + (isBasicTemplate == '2' ? '/looks/A-blank/' : '/looks/A-basic/');
                    let moduleFile = fs.readFileSync(fromDir + '/module.k.js', 'utf8');
                    fs.writeFileSync(appPackageManifest.name + '/Application/module.k.js', moduleFile, 'utf8');

                    console.log('Created successfully');

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
            chain.then(reducer)
        },
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
        'ba': function (name) {
            kv.add.activity(name, null, false);
        },
        'a': function (name) {
            kv.add.activity(name, null, true);
        }
    },
    auth: cb => {
        //var path = (workspaceName ? './' + workspaceName : '.') + "/auth.k.json";
        var path = "./auth.k.json";
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
    load: cb=>{
        
    },
    push: cb=>{
        
    }
}
module.exports = kv;

console.log('Greetings from Kennect Kacy! ', process.argv);

if (process.argv.length == 5) {
    let command = process.argv[2];
    if (command == 'add') {
        let name = process.argv[4].toString();
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
        default:{
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