var Discord     = require('discord.js')
var Guild       = require.main.require('./lib/guild.js')
var Piece       = require.main.require('./piece.js')

class Members extends Piece {

    key() {
        return 'member'
    }

    description() {
        return 'Blade and Soul external Clan Member handling'
    }

    initialize() {

        /**
         * Add member
         */
        this.addCommand('+|add [name]*', (data, context) => {
            let name = data.name.join(' ')

            if (Members.validateName(name, context)) {
                Guild.addMember(name)
                    .then((result) => context.message.channel.send(result))
                    .catch((error) => context.message.channel.send(error))
            }
        }, {
            description: 'Adds a member to the clan list.'
        })

        /**
         * Remove member
         */
        this.addCommand('-|remove [name]*', (data, context) => {
            let name = data.name.join(' ')

            if (Members.validateName(name, context)) {
                Guild.removeMember(name)
                    .then((result) => context.message.channel.send(result))
                    .catch((error) => context.message.channel.send(error))
            }
        }, {
            description: 'Removes a member from the clan list.'
        })

        /**
         * List members
         */
        this.addCommand('ls|list [glue]', (data, context) => {
            let glue = data.glue ? data.glue : '\n'

            Guild.getMembers()
                .then((members) => {
                    let message = `There are ${members.length} members:\n${members.sort().join(glue)}`
                    context.message.channel.send(message)
                })
                .catch((error) => context.message.channel.send(error))
        }, {
            description: 'Displays all members of the clan.'
        })
    }

    static validateName(name, context) {
        if (name !== null && name.length > 0) {
            return true
        } else {
            context.message.channel.send('Invalid name.')
            return false
        }
    }
}

module.exports = Members
