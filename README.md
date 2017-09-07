# kv
The Kvue module consists command line tools to help create K-Views for Kennect Process Apps

## install 
clone this repo and 
``npm -g install``  
or
``npm i -g kv-cli``

## commands

(create a folder named 'yourWorkSpace' and get it registered with KBET by cd 'yourWorkSpace' and these commands below)

1. ``kv auth``: to authenticate yourself
2. ``kv init`` : to create a new app


(cd into the new app folder)

3. ``kv add process 'pid'`` :  and hit this command to create the process
4. ``kv add model 'modelname'`` : in the app folder, add a new model to the app
5. ``kv register`` : register the app with the KBET-server
5. ``kv push`` : reload the app with the KBET-server