var Piece   = require.main.require('./piece.js')
var dedent  = require('dedent-js')

class Management extends Piece {

    key() {
        return ''
    }

    description() {
        return 'Management utilities'
    }

    initialize() {

        /**
         *
         */
        this.addCommand('announce <channel> <minutes> [words]*', (data, context) => {
            let minutes = parseInt(data.minutes)
            if (!minutes || minutes > 8*60) {
                return context.message.channel.send("Available time frame must be within 1 minute and 8 hours")
            }
            let announcement = data.words.join(' ')
            let channel = context.message.guild.channels.find('name', data.channel)
            channel.send(`@everyone ${announcement} in ${this.formatTime(minutes)}`)
            this.countdown(announcement, minutes, channel)
        }, {
            description: 'Schedules an announcement in a channel',
            auth: {
                roles: ['Mod']
            },
        })

    }

    formatTime(minutes) {
        let h = parseInt(minutes / 60)
        let m = minutes % 60
        let time = (h > 0 ? `${h} hours ` : '') + m + (m !== 1 ? ' minutes' : ' minute')
        return time
    }

    countdown(announcement, minutes, channel) {
        const escape = '```'
        let text = this.countdownMessage(announcement, minutes)
        channel.send(text).then(message => this.update(message, announcement, minutes))
    }

    update(message, announcement, minutes, rate = 1) {
        if (minutes <= 0) {
            this.setStatus()
            message.delete()
            return message.channel.send(`@here Now: ${announcement}`)
        }

        if (minutes < rate) rate = minutes

        this.setStatus(`${this.formatTime(minutes)} until ${announcement}`)
        message.edit(this.countdownMessage(announcement, minutes))
        setTimeout(() => this.update(message, announcement, minutes - rate, rate), rate * 60 * 1000)
    }

    countdownMessage(announcement, minutes) {
        const escape = '```'
        let time = this.formatTime(minutes)
        return dedent`${escape}Markdown
            # ${announcement}
            Time until activity: ${time}
            ${escape}
        `
    }

    setStatus(status = '') {
        this.dispatcher.bot.user.setPresence({game: {name: status, type: 0}})   // .setGame not working until v11.1
    }

}

module.exports = Management
