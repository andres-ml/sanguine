var Discord     = require('discord.js')
var Persistency = require.main.require('./persistency/members_persistency.js')
var Piece       = require.main.require('./piece.js')

class Members extends Piece {

    key() {
        return 'members'
    }

    description() {
        return 'Blade and Soul external Clan Member handling'
    }

    initialize() {

        /**
         * Add member
         */
        this.addCommand('+|add [name]*', (data, context) => {
            let name = data.name

            if (Members.validateName(name, context)) {
                Persistency.addMember(name, context)
            }
        }, {
            description: 'Adds a member to the clan list.'
        })

        /**
         * Remove member
         */
        this.addCommand('-|remove [name]*', (data, context) => {
            let name = data.name

            if (Members.validateName(name, context)) {
                Persistency.removeMember(name, context)
            }
        }, {
            description: 'Removes a member from the clan list.'
        })

        /**
         * List member
         */
        this.addCommand('ls|list [delim]', (data, context) => {
            let delim = data.delim

            Persistency.listMember(context, delim)
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