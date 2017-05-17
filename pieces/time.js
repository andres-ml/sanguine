var Piece   = require.main.require('./piece.js')

class Time extends Piece {

    key() {
        return 'time'
    }

    description() {
        return 'Delay and schedule messages'
    }

    schedule(channel, message, secondsFromNow) {
        if (secondsFromNow > 0) {
            channel.send(`Sending message ${message} in ${secondsFromNow} seconds`)
            setTimeout(_ => channel.send(message), secondsFromNow * 1000)
        }
    }

    initialize() {

        /**
         * Sends a message after <seconds> seconds
         */
        this.addCommand('in <seconds> <message>', (data, context) => {
            this.schedule(context.message.channel, data.message, data.seconds)
        }, {
            description: 'Sends message after x seconds'
        })

        /**
         * Sends a message at a specific <time> today
         */
        this.addCommand('at <time> <message>', (data, context) => {
            let timeParts = [0, 0, 0]
            data.time.split(':').forEach( (value, index) => {
                timeParts[index] = value
            })

            let date = new Date()
            date.setHours   (timeParts[0])
            date.setMinutes (timeParts[1])
            date.setSeconds (timeParts[2])

            let now = new Date()
            let differenceInMiliseconds = date.getTime() - now.getTime()

            this.schedule(context.message.channel, data.message, differenceInMiliseconds / 1000)
        }, {
            description: 'Sends message at specific time today, e.g. send 12:10 "Clock says 10 past 12"'
        })

        this.repeated = {}

        /**
         * Sends a message every <minutes> minutes
         */
        this.addCommand('every <minutes> <message>', (data, context) => {
            const snowflake = new Date().getTime()
            let repeat = () => {
                context.message.channel.send(data.message)
                this.repeated[snowflake] = {
                    handler:    setTimeout(repeat, data.minutes * 60 * 1000),
                    message:    data.message,
                    every:      data.minutes
                }
            }
            repeat()
        }, {
            description: 'Sends message every x minutes'
        })

        /**
         * Sends a message every <minutes> minutes
         */
        this.addCommand('stop [id]', (data, context) => {
            if (data.id === null) {
                let message = `Use 'stop <id>' to stop a repeating message. Current list of messages:`
                let total = 0
                for (let id in this.repeated) {
                    let info = this.repeated[id]
                    message += `\n ${id} - ${info.message} (every ${info.every} minutes)`
                    total += 1
                }

                if (total === 0) {
                    message += '\nThere no scheduled messages'
                }

                return context.message.channel.send(message)
            }

            let info = this.repeated[data.id]
            context.message.channel.send(`Deleted scheduled message '${info.message}'`)
            clearTimeout(info.handler)
            delete this.repeated[data.id]
        }, {
            description: 'Stops repeated message with specified id. If no id specified, lists all repeated messages'
        })

    }

}

module.exports = Time
