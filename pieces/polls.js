var Piece   = require.main.require('./piece.js')
var dedent  = require('dedent-js')

class Polls extends Piece {


    description() {
        return 'Easy polls via reactions with live visual updates'
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

    initialize() {

        /**
         * Creates a poll
         */
        this.addCommand('poll <question> [options]*', (data, context) => {
            this.makePoll(data.question, data.options, context.message.channel)
            // let options = data.options.join(' ').split(',').map(option => option.trim())
            // this.makePoll(data.question, options, context.message.channel)
        }, {
            description: 'Make a poll. E.g: poll "Is this bot cool?" Yes! Nah "Maybe..."'
        })

        /**
         * Logs poll voting and updates winner status
         */
        const updatePollResults = reaction => {
            if (reaction.message.content.includes('# Poll')) {
                this.updateResults(reaction.message)
            }
        }

        // live poll results update on vote add and vote remove
        this.addListener('messageReactionAdd',      updatePollResults)
        this.addListener('messageReactionRemove',   updatePollResults)

    }

    makePoll(question, options, channel) {
        const escape = '```'
        const emojiMap = this.emojiMap()

        let pollTemplate = dedent`
            ${escape}Markdown
            # Poll

            ${question}
            ${'='.repeat(question.length)}

            ${options.map( (option, index) => `${index + 1}. ${option}\n#` ).join('\n')}
            ${escape}
        `

        // adds numerical emoji reactions, one for each option up to 10.
        // do it 1 by 1 to ensure they appear sorted
        let addNumericReactions = (message, index = 0) => {
            if (index < options.length) {
                let numberEmoji = emojiMap[index + 1]
                message.react(numberEmoji).then( _ => addNumericReactions(message, index + 1) )
            }
        }

        channel.send(pollTemplate).then(message => addNumericReactions(message))
    }

    updateResults(message) {
        const emojiMap = this.emojiMap()

        let results = Array(Object.keys(emojiMap).length).fill(0)
        message.reactions.forEach(messageReaction => {
            // check if reaction corresponds to a number
            let index = Object.keys(emojiMap).find(key => emojiMap[key] === messageReaction.emoji.name)
            // if it does, update the vote count for its corresponding answer
            if (typeof index !== 'undefined') {
                results[index] = messageReaction.users.size - 1    // remove bot's vote-- DO NOT USE messageReaction.count, it appears to be bugged
            }
        })

        // max progress bar width, i.e. number of characters displayed for a vote with 100% of answers
        const progressBarMaxLength = 50
        // total of votes / reactions
        const totalVotes = results.reduce( (carry, value) => carry + value )
        // regex to find answers. matches strings like these (both lines):
        // 1. bla bla bla
        // #  ||||||||
        const findProgress = index => new RegExp(`(^${index}\\..+\n#)(  \\|*)?`, 'gm')
        // given a number, returns a progress bar, shorter/longer depending on the % of that number / total
        const getProgress = optionVotes => {
            let barLength = totalVotes > 0 ? Math.floor( optionVotes / totalVotes * progressBarMaxLength ) : 0
            return '|'.repeat(barLength + 1)
        }


        let content = message.content

        results.forEach( (optionVotes, index) => {
            let oldProgress = findProgress(index)
            let progress    = getProgress(optionVotes)

            content = content.replace(oldProgress, `$1  ${progress}`)
        })

        message.edit(content)
    }

}

module.exports = Polls
