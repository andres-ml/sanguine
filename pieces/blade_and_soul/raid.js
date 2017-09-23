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
                    console.log(solution)
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
        const users = this.getVotes(message, data)
        const parties = this.buildParties(users, data)
        console.log(parties)
        return parties.map(party => {
            return `${data.options[party.index]}: ${party.members.map(user => user.name).join(', ')}`
        }).join('\n')
    }

    getVotes(message, data) {
        const emojiMap = this.emojiMap()
        const indexMap = {}
        for (let index in emojiMap) {
            indexMap[emojiMap[index]] = parseInt(index) - 1
        }

        const isOptionReaction = reaction => {
            const emoji = reaction.emoji.toString()
            return (emoji in indexMap) && indexMap[emoji] < data.options.length // is numeric reaction and reaction within the range of possible options
        }
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

    buildParties(users, data) {
        let indices = Array(data.options.length).fill(null).map((_, index) => index)
        if (indices.length > data.amount) {
            indices = this.pickBest(users, indices, data.amount, data.size)
        }
        return this.splitPeople(users, indices)
    }

    splitPeople(users, indices) {
        return indices.map(index => new Object({
            index: index,
            members: ['a', 'b']
        }))
    }

    pickBest(users, indices, amount, minPickSize) {
        // returns users that voted for specified option
        let pick = index => {
            const picked = []
            for (var snowflake in users) {
                const user = users[snowflake]
                if (user.options.indexOf(index) !== -1) {
                    picked.push(snowflake)
                }
            }
            return picked
        }
        // returns a new set containing the items from the specified set + the new specified picked items
        let combine = (set, picks) => {
            let next = new Set(set)
            picks.forEach(snowflake => next.add(snowflake))
            return next
        }
        // finds a subset of 'indices' of size 'remaining' such that the total amount of users that voted
        // for any of those indices is included
        let find = (indices, remaining, picked = [], set = new Set()) => {
            let best = {picked: picked, set: set}
            if (remaining === 0) return best

            indices.forEach(function(index, i) {
            	let picks = pick(index)
                if (picks.length < minPickSize) return

            	let iSet = combine(set, picks)
                let iPicked = picked.slice().concat([index])
                let iIndices = indices.slice()
                iIndices.splice(i, 1)

                let iBest = find(iIndices, remaining - 1, iPicked, iSet)
                if (iBest.set.size > best.set.size) {
                	best = iBest
                }
            })

            return best
        }

        const result = find(indices, amount)
        return result.picked
    }

}

module.exports = Raid
