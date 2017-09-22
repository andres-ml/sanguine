var Interactive = require.main.require('./lib/interactive.js')

class Raid extends Interactive {

    key() {
        return 'raid'
    }

    description() {
        return 'Raid management'
    }

    initialize() {

        /**
         * Raid ready check
         */
        this.addCommand('check <size> <amount> [options]*', (data, context) => {
            this.create(context.message.channel, 'Raid check', [
                {
                    emoji: '1⃣',
                    callback: (message, user) => {
                        context.message.channel.send('you clicked!')
                    }
                }
            ])
        }, {
            description: 'Raid ready check'
        })

    }

}

module.exports = Raid
