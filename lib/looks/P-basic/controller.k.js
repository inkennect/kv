k.exports = {
    utils: {
        say: function (word) {
            // util available in app.utils
            console.log(word);
        }
    },
    lifecycle: {
        // these are lifycyle functions | events
        onCreate: (ctx, app) => {

        },
        onWrapUp: (ctx, app) => {

        }
    },
    onRemoteEvent: {
        'sample': (ctx, app, remoteData) => {
            console.log("22222");
        },
    },
    actions: {
        sayHi: (ctx, app) => {
            // this is a sample action which can be tied to an event
            app.utils.say('Hi');
        }
    }
}