var Piece   = require.main.require('./piece.js')

class DevBot extends Piece {

    description() {
        return 'Utilities for Bot development.'
    }

    initialize() {
        this.addCommand('dev|maint|maintenance [mode]', (data, context) => {
            let message = data.mode === '+' ?
                'I\'m currently going to enter maintenance mode! See ya all! :please:' :
                'Hey Guys! I\'m back! :please: Feel free to use my services again!'

            const embed = new Discord.RichEmbed()
                .setDescription(message)

            context.message.channel.send('', {
                embed: embed
            })
        }, {
            description: 'Turns on maintenance mode.'
        })
    }
}

module.exports = DevBot
