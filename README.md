# kv
The KBET module consists command line tools to help create K-Views for Kennect Business Execution Tool: Process Automation Apps.

------
## Install 
- clone this repo and ``npm -g install``  
- or  ``npm i -g kv-cli``

------
## Commands

(create a folder named 'yourWorkSpace' and get it registered with KBET by cd 'yourWorkSpace' and these commands below)


### 1. Workspace and Authentication: 
    - ``kv workspace``: to create your KBET workspace 
    - ``kv auth``: to authenticate yourself.
### 2. Creating new X:
    - ``kv init``: to create a new app.
    - ``kv create model 'modelname'``: Creating a new DataModel.
    - ``kv create service 'serviceName'``: Creating a new Service.
    - ``kv create task 'taskName'``: Creating a new Task.
    - ``kv create channel 'channelName'``: Creating a new Channel for master data access and poking the tenant's servers to notify some events.

(now cd into the new app folder)

### 3. Adding an activity to the App: 
    - ``kv add pa 'aid'`` || ``kv add activity 'aid'``:  Use this command to create the activity with basic template.
    - ``kv add bpa 'aid'``:  Use this command to create the activity with blank template. 

### 4. Adding a model to the App/Service or Task:
    - ``kv add model 'modelName'``: in the app folder, add a new model to the app

### 5. Register an app with KBET:
    - ``kv register``: register the app with the KBET-server

### 6. Deploy the app to KBET: 
    - ``kv push``: reload the app with the KBET-server

------

## Dictionary

### yourWorkSpace: 
The directory where all the KBET related code is residing. The structure is provided by Kennect.
it would be as follows:

```
.
workspace.k.json
/Apps
    /App001
        app.manifest.json
        /Application
            module.k.js
        /P1.0
            manifest.json
            view.k.html
            controller.k.js
        /+P2.0
        /+P2.0    
    /+App002
/Channels
    /Channel001
        channel.manifest.json
        module.k.js
/DataModels
    someModelName.json
/Services
    /Service001
        service.manifest.json
        module.k.js
    /+Service002
/Tasks
    /Task001
        task.manifest.json
        module.k.js
    /+Task002

```