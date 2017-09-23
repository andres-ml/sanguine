const Interactive = require.main.require('./lib/interactive.js')
const dedent = require('dedent-js')

class Raid extends Interactive {

    key() {
        return 'raid'
    }

    description() {
        return 'Raid management'
    }

    /**
     * Map of numbers to their corresponding unicode keycap string
     */
    emojiMap() {
        return {
            1: '1⃣', 2: '2⃣', 3: '3⃣', 4: '4⃣', 5: '5⃣',
            6: '6⃣', 7: '7⃣', 8: '8⃣', 9: '9⃣', 10: '🔟',
        }
    }

    actions(data) {
        return [
            {
                emoji: '🚀',
                callback: (message, user) => {
                    const solution = this.buildRaids(message, data)
                    // user.send(solution)
                }
            }
        ]
    }

    content(data) {
        return [
            `# Raid ready check`,
            `${data.amount} x ${data.size}man raids ready check. Please vote in ALL your available slots.`,
            `${data.options.map((option, index) => `${index + 1}. ${option}`).join('\n')}`
        ].join('\n')
    }

    initialize() {

        /**
         * Raid ready check
         */
        this.addCommand('check <size> <amount> [options]*', (data, context) => {
            const content = this.content(data)
            const actions = this.actions(data)
            this.create(context.message.channel, content, actions, {delay: actions.length * 2000}).then(message => this.addNumericReactions(message, data.options))
        }, {
            description: 'Raid ready check'
        })

    }

    addNumericReactions(message, options) {
        const emojiMap = this.emojiMap()
        let add = (message, index = 0) => {
            if (index < options.length) {
                let numberEmoji = emojiMap[index + 1]
                message.react(numberEmoji).then( _ => add(message, index + 1) )
            }
        }
        add(message, 0)
    }

    buildRaids(message, data) {
        const users = this.getVotes()
    }

    getVotes(data) {
        const emojiMap = this.emojiMap()
        const indexMap = {}
        for (let index in emojiMap) {
            indexMap[emojiMap[index]] = parseInt(index)
        }

        const isOptionReaction = reaction => reaction.emoji.toString() in indexMap
        const isNotSelf = user => user !== this.dispatcher.bot.user

        const users = {}
        message.reactions.filter(isOptionReaction).forEach(messageReaction => {
            messageReaction.users.filter(isNotSelf).forEach((user, snowflake) => {
                if (!(snowflake in users)) {
                    users[snowflake] = {
                        user: user,
                        options: []
                    }
                }
                users[snowflake].options.push(indexMap[messageReaction.emoji.toString()])
            })
        })

        return users
    }

}

module.exports = Raid
