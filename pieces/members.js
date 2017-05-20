var Piece   = require.main.require('./piece.js')
var Discord = require('discord.js')

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
        this.addCommand('+ [name]*', (data, context) => {
            let name = data.name

            // TODO: Call up Repo, or make Persistency layer to pass db related items to Repo

            // context.message.channel.send('')
        }, {
            description: 'Adds a member with name `name`.'
        })

    }

}

module.exports = Members