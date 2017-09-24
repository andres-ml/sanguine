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
                    this.buildRaids(message, data).then(solution => message.channel.send(solution))
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
            this.create(context.message.channel, content, actions, {delay: actions.length * 3000}).then(message => this.addNumericReactions(message, data.options))
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
        const votes = this.getVotes(message, data)
        return new Promise((resolve, reject) => {
            votes.then(users => {
                const result = this.buildParties(users, data)
                const lines = []

                if (result.parties.length === 0) {
                    return resolve('No solutions found')
                }

                const getName = user => user.member.nickname ? user.member.nickname : user.member.user.username

                result.parties.forEach(party => {
                    lines.push(`${data.options[party.index]}${party.members.length == data.size ? '' : ' (incomplete)'}: ${party.members.map(getName).join(', ')}`)
                })
                if (result.partyless.length > 0) {
                    lines.push(`Partyless: ${result.partyless.map(getName).join(', ')}`)
                }
                return resolve(lines.join('\n'))
            })
        })
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
        const promises = []
        message.reactions.filter(isOptionReaction).forEach(messageReaction => {
            messageReaction.users.filter(isNotSelf).forEach((user, snowflake) => {
                if (!(snowflake in users)) {
                    promises.push(message.guild.fetchMember(user))
                    users[snowflake] = {
                        options: []
                    }
                }
                users[snowflake].options.push(indexMap[messageReaction.emoji.toString()])
            })
        })

        return new Promise((resolve, reject) => {
            Promise.all(promises).then(members => {
                members.forEach(member => users[member.user.id].member = member)
                resolve(users)
            })
        })
    }

    buildParties(users, data) {
        let indices = Array(data.options.length).fill(null).map((_, index) => index)
        if (indices.length > data.amount) {
            indices = this.pickBest(users, indices, data.amount, data.size)
        }
        return this.splitPeople(users, indices, data)
    }

    splitPeople(users, indices, data) {
        const list = this.prioritySort(users, indices)
        const parties = indices.map(index => new Object({
            index: index,
            members: []
        }))

        const partyless = []

        list.forEach(user => {
            const party = this.assignParty(user, parties, data)
            if (party !== null) {
                parties[party].members.push(user)
            }
            else {
                partyless.push(user)
            }
        })

        return {
            parties: parties,
            partyless: partyless
        }
    }

    prioritySort(users, indices) {
        this.scoreCache = {}
        return Object.values(users).sort(this.userCompare.bind(this, indices))
    }

    userCompare(indices, user1, user2) {
        return this.score(user2, indices) - this.score(user1, indices)
    }

    score(user, indices) {
        if (!(user.id in this.scoreCache)) {
            const isWarlock = user.member.roles.find('name', 'Warlock')    !== null ? 1 : 0
            const isTank    = user.member.roles.find('name', 'Tank')       !== null ? 1 : 0

            const availability = user.options.filter(option => indices.indexOf(option) !== -1).length
            const randomFactor = Math.floor(Math.random() * 10)

            const score = isTank * 1000   // tanks have max priority
                + isWarlock * 200   // warlocks have high priority
                 // 0 availability means 0 priority (not picked) -- high availability means lower priority
                + (availability === 0 ? -10000 : (availability * -50))
                + randomFactor

            this.scoreCache[user.id] = score
        }

        return this.scoreCache[user.id]
    }

    assignParty(user, parties, data) {
        const available = parties.filter(party => party.members.length < parseInt(data.size))
        available.sort((p1, p2) => p1.members.length - p2.members.length)
        for (let i = 0; i < available.length; ++i) {
            if (user.options.indexOf(parties[i].index) !== -1) {
                return i
            }
        }
        return null
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
