var Piece   = require.main.require('./piece.js')
var fetch   = require('node-fetch')

class Miscellaneous extends Piece {

    key() {
        return ''
    }

    description() {
        return 'Miscellaneous goodies and functions'
    }

    initialize() {

        this.setStatus('the floor is lava')

        /**
         * Server greeting
         */
        this.addListener('guildMemberAdd', (member) => {
            let guild = member.guild
            let channel = guild.channels.find('name', 'welcome')
            if (channel === null) {
                channel = guild.defaultChannel
            }
            channel.send(`Welcome ${member.user} to ${guild.name}!`);
        })

        /**
         * Sends a random xkcd comic (http://xkcd.com)
         */
        this.addCommand('xkcd', (data, context) => {
            const maxIndex = 1500

            let random = Math.floor( Math.random() * maxIndex )
            let url = `https://xkcd.com/${random}/info.0.json`

            fetch(url)
            	.then(res  => res.json())
            	.then(json => {
                    context.message.channel.send('', {
                        file: json.img
                    })
                })
        }, {
            description: 'Sends a random xkcd comic'
        })

        /**
         * Roll one of the options
         */
        this.addCommand('roll [options]*', (data, context) => {
            let random = Math.floor(Math.random() * data.options.length)
            context.message.channel.send(data.options[random])
        }, {
            description: 'Roll to get any of the [options]'
        })

        /**
         * Rolls a number from 1 to 'from', or from 'from' to 'to'
         * E.g.
         *  dice 20 rolls 1-20
         *  dice 20 40 rolls 20-40
         */
        this.addCommand('dice <from> [to]', (data, context) => {
            let min = 1
            let max = parseInt(data.from)
            if (data.to !== null) {
                min = max
                max = parseInt(data.to)
            }

            let random = min + Math.floor( Math.random() * (max + 1 - min) )
            context.message.channel.send(random)
        }, {
            description: 'Rolls a dice from 1 to X (dice X) or from X to Y (dice X Y)'
        })

    }

    setStatus(status) {
        this.dispatcher.bot.user.setGame(status)
    }

}

module.exports = Miscellaneous
