var Piece   = require.main.require('./piece.js')
var Discord = require('discord.js')

class LFP extends Piece {

    key() {
        return ''
    }

    description() {
        return 'Looking For Party'
    }

    initializeDungeons() {
        let dungeons = [
            {
                names: ['tomb', 'dt', 'deso', 'desolate', 'desolate tomb'],
                size: 6
            },
            {
                names: ['ebon', 'ec', 'cita'],
                size: 6
            },
            {
                names: ['foundry', 'nf'],
                size: 6
            },
            {
                names: ['naryu sanctum', 'ns'],
                size: 6
            },
            {
                names: ['irontech forge', 'if', 'itf', 'lab'],
                size: 6
            },
        ]
        dungeons.forEach(dungeon => dungeon.queue = [])
        return dungeons
    }

    initialize() {

        this.dungeons = this.initializeDungeons()

        this.addCommand('lfp|lfg [dungeon]', (data, context) => {
            if (data.dungeon !== null) {
                let message = this.queue(data.dungeon, context.message.author)
                context.message.channel.send(message)
            }
            else {
                this.status(context)
            }
        }, {
            description: 'Show dungeon queues'
        })

        this.addCommand('lfp|lfg + <dungeon>', (data, context) => {
            let message = this.queue(data.dungeon, context.message.author)
            context.message.channel.send(message)
        }, {
            description: 'Queue for a dungeon'
        })

        this.addCommand('lfp|lfg - <dungeon>', (data, context) => {
            let message = this.dequeue(data.dungeon, context.message.author)
            context.message.channel.send(message)
        }, {
            description: 'Dequeue from a dungeon'
        })

    }

    status(context) {
        let showStatus = dungeon => `${dungeon.names[0]}: ${dungeon.queue.length}/${dungeon.size}`
        context.message.channel.send(this.dungeons.map(showStatus).join('\n'))
    }

    queue(dungeonName, user) {
        let name    = dungeonName.trim().toLowerCase()
        let dungeon = this.dungeons.find(dungeon => dungeon.names.indexOf(name) !== -1)

        dungeonName = `\`${dungeonName}\``

        if (!dungeon) {
            return `Could not find dungeon ${dungeonName}`
        }

        if (dungeon.queue.indexOf(user) !== -1) {
            return `You are already queued for ${dungeonName}`
        }

        dungeon.queue.push(user)

        if (dungeon.queue.length === dungeon.size) {
            let members = dungeon.queue.splice(0, dungeon.size)
            return `Party found for ${dungeonName}: ${members.join(', ')}`
        }

        return `Successfully queued you for ${dungeonName}`
    }

    dequeue(dungeonName, user) {
        let name    = dungeonName.trim().toLowerCase()
        let dungeon = this.dungeons.find(dungeon => dungeon.names.indexOf(name) !== -1)

        dungeonName = `\`${dungeonName}\``

        if (!dungeon) {
            return `Could not find dungeon ${dungeonName}`
        }

        if (dungeon.queue.indexOf(user) === -1) {
            return `You are not queued for ${dungeonName}`
        }

        dungeon.queue.splice(dungeon.queue.indexOf(user), 1)

        return `Successfully dequeued you from ${dungeonName}`
    }

}

module.exports = LFP
