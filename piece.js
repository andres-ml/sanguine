class Piece {

    key() {
        return ''
    }

    description() {
        return ''
    }

    options() {
        return {}
    }

    constructor(dispatcher) {
        this.dispatcher = dispatcher
        this.commands   = []
        this.initialize()
    }

    initialize() {

    }

    getCommands() {
        return this.commands
    }

    addCommand(command, callback, options = {}) {
        let wrappedCallback = this.wrapCallback(callback, options)
        this.commands.push({
            command: command,
            callback: wrappedCallback,
            options: options,
        })
    }

    addListener(eventName, callback) {
        this.dispatcher.addListener(eventName, callback)
    }

    /**
     * Wraps a piece-defined callback to automatically handle permissions
     *
     * @param  {Function} callback [description]
     * @param  {[type]}   options  [description]
     * @return {[type]}            [description]
     */
    wrapCallback(callback, options) {
        // list of callback wrappers - they are applied in order
        const wrappers = ['pieceAuth', 'commandAuth']
        return wrappers.reduce((callback, wrapper) => this[wrapper](callback, options), callback)
    }

    /**
     * Per-command permissions auth wrapper
     * @param  {Function} callback [description]
     * @param  {[type]}   options  [description]
     * @return {[type]}            [description]
     */
    commandAuth(callback, options) {
        return this.commonAuth(callback, options)
    }

    /**
     * Per-piece permissions auth wrapper
     * @param  {Function} callback [description]
     * @param  {[type]}   options  [description]
     * @return {[type]}            [description]
     */
    pieceAuth(callback, options) {
        let pieceOptions = this.options()
        return this.commonAuth(callback, pieceOptions)
    }

    /**
     * Permissions auth wrapper
     * If options contains the 'auth' key, the following will be checked in options.auth:
     *  roles (array) the user must have any of the roles in this role name array
     *
     * If options.auth.silent is set, its value will be used to determine whether to notify
     * the user or not (when set to silent, the bot will act as if the command did not exist)
     *
     * @param  {Function} callback [description]
     * @param  {[type]}   options  [description]
     * @return {[type]}            [description]
     */
    commonAuth(callback, options) {
        if ( !('auth' in options) ) return callback

        return (data, context) => {
            if (!this.isAuthorized(context, options.auth)) {
                // only notify if silent option is not specified or is disabled.
                if ( !('silent' in options.auth) || !options.auth.silent) {
                    context.message.channel.send("You do not have permissions to use this command.")
                }
                return  // do nothing, since no permissions
            }
            return callback(data, context)
        }
    }

    isAuthorized(context, authOptions) {
        if ('roles' in authOptions) {
            // get user with roles
            let author = context.message.guild.members.find('id', context.message.author.id)
            // filter command roles that the user has
            let rolesInUser = authOptions.roles.filter(roleName => {
                return author.roles.find('name', roleName) !== null
            })
            // reject if there are none
            if (rolesInUser.length === 0) {
                return false
            }
        }

        return true
    }

}

module.exports = Piece
