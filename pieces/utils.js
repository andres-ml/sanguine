var Piece   = require.main.require('./piece.js')
var dedent  = require('dedent-js')

class Utils extends Piece {

    key() {
        return ''
    }

    description() {
        return 'Utilities'
    }

    initialize() {

        /**
         * Reloads all of the bots' pieces
         */
        this.addCommand('reload', (data, context) => {
            this.dispatcher.build()
            context.message.channel.send('Reloaded bot pieces')
        }, {
            auth: {
                roles: ['Mod']
            }
        })


        let aliases = {}

        /**
         * Aliases commands
         *
         * E.g.
         *  alias sendIn2 "time in 2"
         *
         * Then:
         *  sendIn2 "Hi there"
         *
         * Would have the same effect as:
         *  time in 2 "Hi there"
         *
         * Alias will fail if it already exists. Error message only if
         * it exists as an alias and not a normal command.
         *
         */
        this.addCommand('alias <alias> [parts]*', (data, context) => {
            let command = data.parts.join(' ')

            if (data.alias in aliases) {
                return context.message.channel.send(`Failed to create alias '${data.alias}', it already exists`)
            }

            aliases[data.alias] = command

            this.dispatcher.commander.add(data.alias, (data, context) => {
                // build full command. pass arguments to allow using aliases as partial calls. escape arguments with quotes
                let fullCommand = command + ' ' + data._all.map(part => `"${part}"`).join(' ')
                this.dispatcher.run(fullCommand, context.message)
            })

            context.message.channel.send(`Aliased ${command} to '${data.alias}'`)
        }, {
            description: 'Aliases a command. E.g: alias sendIn1h "time in 3600"',
            auth: {
                roles: ['Mod']
            }
        })


        /**
         * Sends help to user that requests
         */
        this.addCommand('help [pieces]*', (data, context) => {
            let help = this.buildHelp(data.pieces)
            context.message.author.send(help)
        }, {
            description: 'print this help'
        })

    }

    buildHelp(pieces) {
        let prefix = this.dispatcher.config.prefix

        let pieceKeys = []
        let piece = this.dispatcher

        if (pieces.length > 0) {
            let children = this.flatten(piece).piecesWithKey
            let child = children.find(piece => piece.piece.key() === pieces[0])
            while (child) {
                pieceKeys.push(pieces.shift())
                piece = child
                children = this.flatten(piece).piecesWithKey
                child = children.find(piece => piece.piece.key() === pieces[0])
            }
        }

        return this.buildPieceHelp(prefix, pieceKeys, piece)
    }

    buildPieceHelp(prefix, keys, piece) {
        let data = this.flatten(piece)

        let commands = data.commands
        let piecesWithKey = data.piecesWithKey

        let keysPrefix = keys.map(key => key + ' ').join('')

        let help = []

        help.push.apply(help, commands.map(command => {
            let description = 'description' in command.options ? command.options.description : null
            return `* ${prefix}${keysPrefix}${command.command}${description ? '\n> ' + description : ''}`
        }))

        if (piecesWithKey.length > 0) {
            help.push('')
            help.push(`To find out more about other commands, type:`)
            help.push.apply(help, piecesWithKey.map(piece => {
                let description = piece.piece.description()
                return `${prefix}help ${keysPrefix}${piece.piece.key()}${description ? `\n> ${description}` : ''}`
            }))
        }

        return dedent`
            \`\`\`Markdown
            ${help.join('\n')}
            \`\`\`
        `
    }

    flatten(piece) {
        let commands = 'piece' in piece ? piece.piece.getCommands() : []
        let piecesWithKey = piece.parts.filter(piece => piece.piece.key())

        piece.parts
            .filter(piece => !piece.piece.key())
            .forEach(piece => {
                let data = this.flatten(piece)
                commands.push.apply(commands, data.commands)
                commands.push.apply(piecesWithKey, data.piecesWithKey)
            })

        return {
            commands: commands,
            piecesWithKey: piecesWithKey
        }
    }

}

module.exports = Utils
