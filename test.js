let kv = require('./lib/generate');
function testActivityCreation(e) {
    console.log('testing ActivityCreation: ');
    //kv.create.activity('1.0');
    kv.create.activity(e||'_testActivity_'+new Date().getTime());
}
function testAppCreation() {
    console.log('testing ActivityCreation: ');
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


//testActivityCreation(2.2)
testAppCreation()
//testkvAuth()
//testkvRegister();
//testkvPush()
//testKvModelAdd()