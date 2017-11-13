module.exports = {
    events: [
        'youHaveAnUpdate'
    ],
    broadcasts: [
        'someBroadCastedUpdate'
    ],
    methods: {
        sampleMethod: async function (ctx, data) {
            // ctx is context
            // this  = { models, events, broadcasts }
            let kid = await this.models.kids.findOne({ name: data.name });
            return { kidMatched: kid, msg: 'worked !' };
        }
    }
}