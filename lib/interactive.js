const Piece   = require.main.require('./piece.js')
const uuidv1  = require('uuid/v4')
const MarkdownHelper = require.main.require('./lib/markdown_helper.js')
const AuthHelper = require.main.require('./lib/auth_helper.js')

/**
 * Piece that allows sending messages with interactive reactions
 */
class Interactive extends Piece {

    initialize() {
        this.registered = []
    }

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
     * @param  {string} key key of the interaction, must be unique. used to identify message events
     * @param  {[type]} channel channel where we have to send the message
     * @param  {[type]} interactions text of the message
     * @param  {[type]} interactions array possible actions
     * @return undefined
     */
    create(key, channel, text, options = {}) {
        if (!(key in this.registered)) {
            return
        }

        const interactions = this.registered[key]

        const content = this.buildContent(key, text)
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
     * @param  {[type]} key [description]
     * @param  {[type]} text [description]
     * @return {[type]}      [description]
     */
    buildContent(key, text) {
        return MarkdownHelper.build(`> ${key}\n${text}`)
    }

    /**
     * Registers a key for interactive messages
     *
     * @param  {string} key
     * @param  {array} interactions
     */
    register(key, interactions) {
        this.registered[key] = interactions
        // listen for reaction event
        this.addListener('messageReactionAdd', (reaction, user) => {
            // check if it's our message
            if (reaction.message.content.includes(`> ${key}`)) {
                for (let interaction of interactions) {
                    // check if the reaction is one of those matching an option,
                    // and that it is not a self-reaction (by the bot)
                    if (interaction.emoji === reaction.emoji.toString() && user !== this.dispatcher.bot.user) {
                        // remove reaction so user can click again if he wants
                        reaction.remove(user)
                        // call back -- check auth if necessary
                        if (!('auth' in interaction) || AuthHelper.isAuthorized(user, reaction.message.guild, interaction.auth)) {
                            interaction.callback(reaction.message, user)
                        }
                    }
                }
            }
        })
    }

}

module.exports = Interactive
