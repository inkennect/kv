module.exports = function () {
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
}