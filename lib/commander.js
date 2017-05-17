var Utils = require('./utils.js')

var Commander = (function() {

    // split command into parts
    const command_definition_regex = /[^" ]+/g
    // normal part is a word. all special chars except <>[] allowed
    const part_regex = /^[^\<\>\[\]]+$/
    // required arguments are defined as <argument_name>
    const required_argument_regex = /^\<(.+?)\>$/
    // optional arguments are defined as [argument_name]. adding * ([name]* will try to match many)
    const optional_argument_regex = /^\[(.+?)\](\*?)$/

    function Command(command_string) {
        this.command_string = command_string
        this.parts = []
        this.arguments = {
            required: [],
            optional: [],
        }
        var parts = command_string.match(command_definition_regex)
        var count = 0
        count = this._addParts(parts, count)
        count = this._addRequired(parts, count)
        count = this._addOptional(parts, count)
        if (count < parts.length) {
            throw new Error("Could not parse command. Commands must be: word+ <optional>* [required]*")
        }
    }

    Command.fromString = function(command_string) {
        return new Command(command_string)
    }

    Command.prototype.buildData = function(args) {
        var required = this.arguments.required
        var optional = this.arguments.optional
        if (args.length < required.length) {
            var missing = required.slice(args.length)
            var message = "Missing " + missing.length + " arguments (" + missing.join(',') + ")"
            message += " (command: " + this.command_string + ")"
            throw new Error(message)
        }
        var data = {}
        for (var i = 0; i < required.length; ++i) {
            data[required[i]] = args[i]
        }
        var i = 0
        var arg_i = i + required.length
        while (i < optional.length) {
            var optional_argument = optional[i]
            if (optional_argument.endsWith('*')) {
                optional_argument = optional_argument.substring(0, optional_argument.length - 1)
                data[optional_argument] = []
                while (arg_i < args.length) {
                    data[optional_argument].push(args[arg_i++])
                }
            }
            else {
                var value = arg_i < args.length ? args[arg_i] : null
                data[optional_argument] = value
            }
            ++i
            ++arg_i
        }

        data._all = args
        return data
    }

    Command.prototype._addParts = function(parts, count) {
        while (count < parts.length) {
            var match = parts[count].match(part_regex)
            if (!match) break
            this.parts.push(match[0])
            ++count
        }
        return count
    }

    Command.prototype._addRequired = function(parts, count) {
        while (count < parts.length) {
            var match = parts[count].match(required_argument_regex)
            if (!match) break
            this.arguments.required.push(match[1])
            ++count
        }
        return count
    }

    Command.prototype._addOptional = function(parts, count) {
        while (count < parts.length) {
            var match = parts[count].match(optional_argument_regex)
            if (!match) break
            this.arguments.optional.push(match[1] + match[2])
            ++count
        }
        return count
    }

    // regex to parse calls to commands; in this order:
    // /"[^"]+"+/   quoted arguments, e.g. "john smith"
    // /[^ ]+/      single-word arguments
    const command_call_regex = /"([^"]+)"|([^ ]+)/g

    // alias delimiter for commands: e.g. color|colour
    // WARNING: the whole command structure is cloned for each alias;
    // declaring several aliases for the root command part could be slow
    const alias_delimiter  = '|'

    function Commander() {
        this._commandTree = {}
    }

    Commander.prototype.add = function(command_string, callback) {
        var command = Command.fromString(command_string)
        this._insertCommand(command, callback)
    }

    Commander.prototype.run = function(command_string, context = {}) {
        var parts = Utils.matches(command_string, command_call_regex)
        return this._runInTree(parts, context)
    }

    Commander.prototype._insertCommand = function(command, callback) {
        return this._insertCommandInTree(command, callback, 0, this._commandTree)
    }

    Commander.prototype._insertCommandInTree = function(command, callback, index, commandTree) {
        if (index < command.parts.length) {
            return command.parts[index].split(alias_delimiter).forEach(alias => {
                if ( !(alias in commandTree) ) {
                    commandTree[alias] = {}
                }
                this._insertCommandInTree(command, callback, index + 1, commandTree[alias])
            })
        }
        if ("_call" in commandTree) {
            console.warn("Command '" + command.parts.join(' ') + "' already defined; skipping insertion")
            return
        }
        commandTree._call = this._buildCall(callback, command)
    }

    Commander.prototype._buildCall = function(callback, command) {
        return function(command_arguments, context) {
            return callback(command.buildData(command_arguments), context)
        }
    }

    Commander.prototype._runInTree = function(parts, context) {
        var index = 0
        var commandTree = this._commandTree
        while (parts[index] in commandTree) {
            commandTree = commandTree[parts[index++]]
        }
        if (!("_call" in commandTree)) {
            throw new Error("Command " + parts.slice(0, index).join(' ') + " not found")
        }
        return commandTree._call(parts.slice(index), context)
    }

    Commander.prototype._locateInTree = function(keys, commandTree) {
        if (keys.length === 0 || !(keys[0] in commandTree)) {
            return {tree: commandTree, remaining: keys}
        }
        return this._locateInTree(keys.slice(1), commandTree[keys[0]])
    }

    return Commander

})()

module.exports = Commander
