let kv = require('./lib/generate');
function testProcessCreation(e) {
    console.log('testing ProcessCreation: ');
    //kv.create.process('1.0');
    kv.create.process(e||'_testProcess_'+new Date().getTime());
}
function testAppCreation() {
    console.log('testing ProcessCreation: ');
    //kv.create.process('1.0');
    kv.create.app('_testApp_'+new Date().getTime());
}
function testkvAuth(){
    console.log('testing kv auth: ');
    kv.auth();
}
function testkvPush(){
    console.log('testing kv push: ');
    kv.push();
}
function testkvRegister(){
    console.log('testing kv register: ');
    kv.register();
}
function testKvModelAdd(){
    console.log('testing kv model add: ');
    kv.add.model('dinosaurs');
}


//testProcessCreation(2.2)
//testAppCreation()
//testkvAuth()
//testkvRegister();
//testkvPush()
//testKvModelAdd()