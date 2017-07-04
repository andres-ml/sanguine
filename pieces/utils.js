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
        this.addCommand('help', (data, context) => {
            let help = this.buildHelp()
            let helpLines = help.split('\n')
            let chunk = 0
            let chunkSize = 20
            while (chunk < helpLines.length) {
                context.message.author.send('```' + helpLines.slice(chunk, chunk + chunkSize).join('\n') + '```')
                chunk += chunkSize
            }

        }, {
            description: 'print this help'
        })

    }

    buildHelp(piece = null) {
        let prefix = this.dispatcher.config.prefix
        if (piece !== null) prefix = piece.piece.key()

        let description = this.dispatcher.config.description
        if (piece !== null) description = piece.piece.description()

        let commands = []
        if (piece !== null) commands = piece.piece.getCommands()

        let parts = this.dispatcher.pieces
        if (piece !== null) parts = piece.parts


        let pad = string => {
            const padLength = 4;
            let times = Math.max(1, 5 - Math.floor(string.length / 25))
            return padLength * times + string.length % 4

        }

        let header = [prefix, description].filter(n => n).join(' - ')
        let getCommandHelp = command => {
            let description = 'description' in command.options ? command.options.description : null
            return `~ ${command.command}${description ? '\n    ' + description : ''}`
        }

        let getPartHelp = part => {
            return this.buildHelp(part).split('\n').join('\n  ')
        }

        let escape = '```'
        let help = dedent`
            ${'-'.repeat(header.length)}
            ${header}
            ${'-'.repeat(header.length)}
            ${commands.map(getCommandHelp).join('\n')}
            ${parts.map(getPartHelp).map(help => '  ' + help).join('\n')}
        `

        return help
    }

}

module.exports = Utils
