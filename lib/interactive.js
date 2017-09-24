var Piece   = require.main.require('./piece.js')
var uuidv1  = require('uuid/v4')
const MarkdownHelper = require.main.require('./lib/markdown_helper.js')

/**
 * Piece that allows sending messages with interactive reactions
 */
class Interactive extends Piece {

    /**
     * Sends a message with reactions. Clicking on those reactions will trigger
     * user-defined behavior
     *
     * Bot must have permissions do delete reactions
     *
     * interactions are an array of possible interactions with the action
     * Each contains an emoji and a callback. Reacting with that emoji will
     * call that callback with the message and user that reacted as parameters.
     *
     * @param  {[type]} channel channel where we have to send the message
     * @param  {[type]} interactions text of the message
     * @param  {[type]} interactions array possible actions
     * @return undefined
     */
    create(channel, text, interactions, options = {}) {
        let uuid = uuidv1() // unique identifier for the message
        let content = this.buildContent(uuid, text)

        this.listenToReactions(uuid, interactions)
        const promise = channel.send(content)

        // add option base reactions one by one
        let addInteractions = (message, index = 0) => {
            if (index < interactions.length) {
                const option = interactions[index]
                message.react(option.emoji).then( _ => addInteractions(message, index + 1) )
            }
        }

        promise.then(message => {
            const delay = 'delay' in options ? options.delay : 0
            setTimeout(() => addInteractions(message), delay)
        })

        return promise
    }

    /**
     * Builds message content
     *
     * @param  {[type]} uuid [description]
     * @param  {[type]} text [description]
     * @return {[type]}      [description]
     */
    buildContent(uuid, text) {
        return MarkdownHelper.build(`> ${uuid}\n${text}`)
    }

    /**
     * Listents to reactions to specified message with actions
     *
     * @param  {[type]} uuid    message identifier
     * @param  {[type]} interactions interactions
     */
    listenToReactions(uuid, interactions) {
        // listen for reaction event
        this.addListener('messageReactionAdd', (reaction, user) => {
            // check if it's our message
            if (reaction.message.content.includes(uuid)) {
                for (let interaction of interactions) {
                    // check if the reaction is one of those matching an option,
                    // and that it is not a self-reaction (by the bot)
                    if (interaction.emoji === reaction.emoji.toString() && user !== this.dispatcher.bot.user) {
                        // remove reaction so user can click again if he wants
                        reaction.remove(user)
                        // call back
                        interaction.callback(reaction.message, user)
                    }
                }
            }
        })
    }

}

module.exports = Interactive
