const Interactive = require.main.require('./lib/interactive.js')
const ReactionHelper = require.main.require('./lib/reaction_helper.js')
const dedent = require('dedent-js')
const Discord = require('discord.js')

class Raid extends Interactive {

    key() {
        return 'raid'
    }

    description() {
        return 'Raid management'
    }

    /**
     * List of interactions with the message. One interaction to tell the bot
     * to build the parties
     *
     * @param  {object} data
     * @return {array} array of interactions
     */
    actions(data) {
        return [
            {
                emoji: '🚀',
                callback: (message, user) => {
                    this.buildRaids(message, data).then(solution => user.send(solution))
                }
            }
        ]
    }

    initialize() {

        super.initialize()

        /**
         * Raid ready check
         */
        this.addCommand('check <size> <amount> [options]*', (data, context) => {
            const content = this.content(data)
            const actions = this.actions(data)
            this.create(context.message.channel, content, actions, {delay: data.options.length * 3000}).then(message => ReactionHelper.addNumericReactions(message, data.options.length))
        }, {
            description: 'Raid ready check'
        })

        /**
         * Raid ready check
         */
        this.addCommand('test', (_, context) => {
            const data = this.getTestData1()
            console.log(this.formatResult(this.buildParties(data.users, data.data), data.data))
        }, {
            description: 'Raid ready check'
        })

    }

    /**
     * Returns a string containing the body of the interactive message
     * @param  {object} data
     * @return {string}
     */
    content(data) {
        return [
            `# Raid ready check`,
            `${data.amount} x ${data.size}man raids ready check. Please vote in ALL your available slots.`,
            `${data.options.map((option, index) => `${index + 1}. ${option}`).join('\n')}`
        ].join('\n')
    }

    /**
     * List of roles to search on a user that might prioritize his spot in raid
     * @return {array} array of roles, containing their name and their score modifier
     */
    getRoleScores() {
        return [
            {
                name: 'Tank',
                score: 20,
            },
            {
                name: 'Warlock',
                score: 7,
            },
        ]
    }

    /**
     * Builds raids based on the original data and the votes from users on
     * the interactive message
     *
     * @param  {Discord.Message} message [description]
     * @param  {object} data    [description]
     * @return {Promise} promise that resolves into a string containing party data
     */
    buildRaids(message, data) {
        const votes = this.getVotes(message, data)
        return new Promise((resolve, reject) => {
            votes.then(users => {
                const result = this.buildParties(users, data)
                resolve(this.formatResult(result, data))
            })
        })
    }

    /**
     * Extracts user votes from the reactions of a message
     *
     * @param  {Discord.Message} message [description]
     * @param  {object} data    [description]
     * @return Promise}         [description]
     */
    getVotes(message, data) {
        const emojiMap = ReactionHelper.emojiMap
        const indexMap = {}
        // map each reaction string to the corresponding option index
        for (let index in emojiMap) {
            indexMap[emojiMap[index]] = parseInt(index) - 1 // vote '1' corresponds to index 0, and so on
        }

        // filter numeric reactions, and only those within the range of possible options
        const isOptionReaction = reaction => {
            const emoji = reaction.emoji.toString()
            return (emoji in indexMap) && indexMap[emoji] < data.options.length
        }
        // discard the bot's reactions, that only serve as buttons/placeholders
        const isNotSelf = user => user !== this.dispatcher.bot.user

        const users = {}
        const promises = []
        // for each reaction
        message.reactions.filter(isOptionReaction).forEach(messageReaction => {
            // for each user that voted it
            messageReaction.users.filter(isNotSelf).forEach((user, snowflake) => {
                // create base user if it didn't exist yet
                if (!(snowflake in users)) {
                    // we need to fetch the corresponding GuildMember to know the user's roles
                    promises.push(message.guild.fetchMember(user))
                    users[snowflake] = {
                        options: []
                    }
                }
                // register his vote
                const optionIndex = indexMap[messageReaction.emoji.toString()]
                users[snowflake].options.push(optionIndex)
            })
        })

        return new Promise((resolve, reject) => {
            // once we have roles for all users
            Promise.all(promises).then(members => {
                // add the fetched GuildMember to each user, then resolve with the complete data
                members.forEach(member => users[member.user.id].member = member)
                resolve(users)
            })
        })
    }

    /**
     * Builds parties based on the available options and user votes
     *
     * @param  {array} users array of users, containing their GuildMember and the options they voted
     * @param  {object} data
     * @return {object} solution / list of raids and their composition
     */
    buildParties(users, data) {
        let indices = Array(data.options.length).fill(null).map((_, index) => index)
        // if there are more options than we need, pick the best
        if (indices.length > data.amount) {
            indices = this.pickBest(users, indices, data.amount, data.size)
        }
        // split people among the chosen options/parties
        return this.splitPeople(users, indices, data)
    }

    /**
     * Given a list of options (indices) and a list of users which voted on those
     * options, returns the subset of options (of indices) voted by most people
     *
     * The algorithm explores all possible combinations.
     *
     * @param  {array} users array of users and their votes. each user.options contains elements from indices
     * @param  {array} indices list of indices
     * @param  {int} amount size of the subset, i.e. number of options to be picked out of indices
     * @param  {int} minPickSize minimum size of a raid to be considered an option
     * @return {array} subset of indices
     */
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

    /**
     * Given a list of users and options, returns a combination of users
     * assigned to options
     *
     * Optimality is NOT guaranteed. This is just a greedy algorithm
     * that estimates the value of a user, then assigns all users starting from
     * the one with the highest priority, to the one with lowest priority
     *
     * The priority is just an estimate. It is possible for this algorithm to not
     * find a solution when valid combination exists
     *
     *
     * @param  {array} users   [description]
     * @param  {array} indices [description]
     * @param  {object} data    [description]
     * @return {object}         [description]
     */
    splitPeople(users, indices, data) {
        // sort users by their score
        const list = this.prioritySort(users, indices)
        console.log(this.scoreCache)
        // initialize parties
        const parties = indices.map(index => new Object({
            index: index,
            members: []
        }))
        // keep track of people without party
        const partyless = []

        // for each user, assign user to a party
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

    /**
     * Sorts user by score. A cache is kept to avoid recalculating scores for users
     *
     * @param  {array} users   [description]
     * @param  {attay} indices [description]
     * @return {array} sorted users
     */
    prioritySort(users, indices) {
        this.scoreCache = {}
        return Object.values(users).sort((user1, user2) => this.score(user2, indices) - this.score(user1, indices))
    }

    /**
     * Estimates the score(pariority) of a user based on:
     *
     * - Arbitrary score roles defined in this.getRoleScores()
     * - their availability. The more options a user allows, the less urgent it is to place it somewhere
     * - a small random factor to offer different solutions and try to counter the possibility of no solutions found
     *
     * @param  {object} user    [description]
     * @param  {array} indices [description]
     * @return {int}         [description]
     */
    score(user, indices) {
        if (!(user.member.id in this.scoreCache)) {
            let roleScore = 0
            this.getRoleScores().forEach(role => {
                if (user.member.roles.find('name', role.name) !== null) {
                    roleScore += role.score
                }
            })

            // availability goes from 0 when the user can attend everything, to 1 when he has only 1 option
            const userOptions = user.options.filter(option => indices.indexOf(option) !== -1)
            const availability = (userOptions.length - 1) / Math.max(indices.length - 1, 1)
            // random factor goes from -0.5 to 0.5
            const randomFactor = Math.random() - 0.5

            // arbitrary weights, they can be played with
            const availabilityWeight = -10
            const randomWeight = 2

            // compute final score, save it in cache
            const score = roleScore + availability * availabilityWeight + randomFactor * randomWeight
            this.scoreCache[user.member.id] = score
        }

        return this.scoreCache[user.member.id]
    }

    /**
     * Assigns a user to a party/option.
     * Assigns the user to the party with less members, among those the user can attend.
     *
     * Again, optimality is not guaranteed, nor is finding a solution
     *
     * @param  {object} user    [description]
     * @param  {array} parties [description]
     * @param  {object} data    [description]
     * @return {int} party index
     */
    assignParty(user, parties, data) {
        // sort parties by how full they are, or by their natural order when they are both just as full
        parties.sort((p1, p2) => {
            const lengthDifference = p1.members.length - p2.members.length
            return lengthDifference !== 0 ? lengthDifference : (p1.index - p2.index)
        })
        // find the first party that is not full and that the user can attend to
        for (let partyIndex = 0; partyIndex < parties.length; ++partyIndex) {
            const party = parties[partyIndex]
            if (party.members.length < parseInt(data.size) && user.options.indexOf(party.index) !== -1) {
                return partyIndex
            }
        }
        return null
    }

    /**
     * Formats the final message to send the user with the results of the parties built
     *
     * @param  {object} result [description]
     * @param  {object} data   [description]
     * @return {string}        [description]
     */
    formatResult(result, data) {
        if (result.parties.length === 0) {
            return 'No solutions found'
        }

        const lines = []
        const getName = user => user.member.nickname ? user.member.nickname : user.member.user.username

        // sorty by their original order
        result.parties.sort((party1, party2) => party1.index - party2.index)
        result.parties.forEach(party => {
            lines.push(`${data.options[party.index]}${party.members.length == data.size ? '' : ' (incomplete)'}: ${party.members.map(getName).join(', ')}`)
        })
        if (result.partyless.length > 0) {
            lines.push(`Partyless: ${result.partyless.map(getName).join(', ')}`)
        }
        return lines.join('\n')
    }

    getTestData1() {
        return {
            users: [
                {
                    member: {
                        id: 0,
                        user: {username: 'Tank1'},
                        roles: new Discord.Collection([[0, {name: 'Tank'}]])
                    },
                    options: [1, 2, 3]
                },
                {
                    member: {
                        id: 1,
                        user: {username: 'Tank2'},
                        roles: new Discord.Collection([[0, {name: 'Tank'}]])
                    },
                    options: [0, 3]
                },
                {
                    member: {
                        id: 2,
                        user: {username: 'Tank3'},
                        roles: new Discord.Collection([[0, {name: 'Tank'}]])
                    },
                    options: [2]
                },
                {
                    member: {
                        id: 3,
                        user: {username: 'Warlock1'},
                        roles: new Discord.Collection([[1, {name: 'Warlock'}]])
                    },
                    options: [1, 2, 3]
                },
                {
                    member: {
                        id: 4,
                        user: {username: 'Warlock2'},
                        roles: new Discord.Collection([[1, {name: 'Warlock'}]])
                    },
                    options: [1, 2, 3]
                },
                {
                    member: {
                        id: 5,
                        user: {username: 'Warlock3'},
                        roles: new Discord.Collection([[1, {name: 'Warlock'}]])
                    },
                    options: [3]
                },
                {
                    member: {
                        id: 6,
                        user: {username: 'Filler1'},
                        roles: new Discord.Collection()
                    },
                    options: [1]
                },
                {
                    member: {
                        id: 7,
                        user: {username: 'Filler2'},
                        roles: new Discord.Collection()
                    },
                    options: [1, 2, 3]
                },
                {
                    member: {
                        id: 8,
                        user: {username: 'Filler3'},
                        roles: new Discord.Collection()
                    },
                    options: [1, 2, 3]
                },
                {
                    member: {
                        id: 9,
                        user: {username: 'Filler4'},
                        roles: new Discord.Collection()
                    },
                    options: [3]
                },
                {
                    member: {
                        id: 10,
                        user: {username: 'Alone'},
                        roles: new Discord.Collection()
                    },
                    options: [0]
                },
            ],
            data: {
                size: 3,
                amount: 3,
                options: ['Thursday', 'Friday', 'Saturday', 'Sunday']
            }
        }
    }

    getTestData2() {
        return {
            users: [
                {
                    member: {
                        id: 0,
                        user: {username: 'Tank1'},
                        roles: new Discord.Collection([[0, {name: 'Tank'}]])
                    },
                    options: [0, 1]
                },
                {
                    member: {
                        id: 1,
                        user: {username: 'Tank2'},
                        roles: new Discord.Collection([[0, {name: 'Tank'}]])
                    },
                    options: [0, 1]
                },
                {
                    member: {
                        id: 2,
                        user: {username: 'Warlock1'},
                        roles: new Discord.Collection([[1, {name: 'Warlock'}]])
                    },
                    options: [0, 1]
                },
                {
                    member: {
                        id: 3,
                        user: {username: 'Filler'},
                        roles: new Discord.Collection()
                    },
                    options: [0]
                },
            ],
            data: {
                size: 2,
                amount: 2,
                options: ['Saturday', 'Sunday']
            }
        }
    }

}

module.exports = Raid
