module.exports = async function () {
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
    fs.writeFileSync('./.gitignore', ".auth.k.json\n")
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
            exec('git init && git remote add origin ' + remoteUrl + ' && git add . && git commit -m "initialized kbet workspace" ',
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
}