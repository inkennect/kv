fs = require('fs');
colors = require('colors')
readline = require('readline');
kbet = require('./kbet');
exec = require('child_process').exec;

Writable = require('stream').Writable;
mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
        if (!this.hidden) {
            process.stdout.write(chunk, encoding);
        }
        callback();
    }
});
mutableStdout.hidden = false;

getRepo = function () {
    let path = './workspace.json';
    if (!fs.statSync(path)) {
        console.error("workspace.json does not exist")
        process.exit();
    } else {
        return JSON.parse(fs.readFileSync(path));
    }
}
question = qstn => new Promise((s, j) => {
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
