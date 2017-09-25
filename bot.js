var Discord     = require('discord.js')
var Commander   = require('./lib/commander.js')

class Bot {

    constructor(config) {
        this.config = config
        this.initialize()
    }

    initialize() {
        this.bot = new Discord.Client()
        this.bot.login(this.config.auth)

        this.bot.on('ready', () => {
            this.build()
            this.bot.on('message', message => {
                if (message.content.indexOf(this.config.prefix) === 0) {
                    let command = message.content.substring(this.config.prefix.length)
                    this.run(command, message)
                }
            })
        })

        this.patchReactionAdd()
    }

    run(command, message) {
        // uncomment to automatically reload before each command (useful while developing)
        // this.build()
        try {
            this.commander.run(command, {message: message})
        }
        catch (error) {
            console.log(error)
        }
    }

    build() {
        this.clearEvents()
        this.commander = new Commander()
        this.parts = this.loadPieces('./pieces')
        this.parts.forEach(piece => this.loadCommands(piece))
    }

    loadPieces(directory) {
        let parts = []
        try {
            parts = this.loadDirectory(directory)
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.log(directory, error)
            }
        }
        return parts
    }

    loadDirectory(directory) {
        let parts = []

        require('fs')
            .readdirSync(directory)
            .filter(fileName => fileName.match(/\.js$/))
            .forEach(fileName => {
                let part = this.loadPiece(directory, fileName)
                parts.push( part )
            })

        return parts
    }

    loadPiece(directory, fileName) {
        let piecePath = directory + '/' + fileName
        delete require.cache[require.resolve(piecePath)]

        let Piece = require(piecePath)
        let piece = new Piece(this)

        let pieceName = fileName.replace('.js', '')
        let pieceParts = this.loadPieces(directory + '/' + pieceName)
        return {
            piece: piece,
            parts: pieceParts
        }
    }

    loadCommands(piece, prefix = []) {
        prefix.push(piece.piece.key())

        piece.piece.getCommands().forEach(command => {
            let commandString = prefix
                .concat([command.command])  // add current
                .filter(key => key)         // filter out empty keys
                .join(' ')                  // to string

            console.log(`Adding command '${commandString}'`)
            this.commander.add(commandString, command.callback)
        })

        piece.parts.forEach(part => {
            this.loadCommands(part, prefix.slice())
        })
    }

    clearEvents() {
        for (let eventName in this.events) {
            this.events[eventName].forEach(callback => {
                this.bot.removeListener(eventName, callback)
            })
        }
        this.events = {}
    }

    addListener(eventName, callback) {
        let eventCallback = function() {
            try {
                callback.apply(this, arguments)
            } catch (error) {
                console.log(error)
            }
        }

        if (!(eventName in this.events)) {
            this.events[eventName] = []
        }

        this.events[eventName].push(eventCallback)
        this.bot.on(eventName, eventCallback)
    }



    /**
     * messageReactionAdd only works for cached messages
     * we manually listen for all reactions and emit a manual event
     *
     * @return {[type]} [description]
     */
    patchReactionAdd() {
        const client = this.bot
        client.on('raw', packet => {
            if (packet.t === 'MESSAGE_REACTION_ADD' || packet.t === 'MESSAGE_REACTION_REMOVE') {
                const data = packet.d
                const eventName = packet.t === 'MESSAGE_REACTION_ADD' ? 'messageReactionAdd' : 'messageReactionRemove'

                const channel = client.channels.get(data.channel_id)
                if (!channel.messages.has(data.message_id)) {
                    channel.fetchMessage(data.message_id).then(message => {
                        Promise.all(message.reactions.map(reaction => reaction.fetchUsers())).then(_ => {
                            const messageReaction = message.reactions.find(reaction => reaction.emoji.name === data.emoji.name)
                            client.emit(eventName, messageReaction, messageReaction.users.get(data.user_id))
                        })
                    })
                }
            }
        })
    }

}
module.exports = Bot
