class Piece {

    key() {
        return ''
    }

    description() {
        return ''
    }

    constructor(dispatcher) {
        this.dispatcher = dispatcher
        this.commands   = []
        this.initialize()
    }

    initialize() {

    }

    addCommand(command, callback, options = {}) {
        this.commands.push({
            command: command,
            callback: callback,
            options: options,
        })
    }

    addListener(eventName, callback) {
        this.dispatcher.addListener(eventName, callback)
    }

    getCommands() {
        return this.commands
    }

}

module.exports = Piece
