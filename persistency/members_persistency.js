var Repo = require.main.require('./lib/repo.js')

class MembersPersistency {

    static addMember(name, context) {
        this.findMember(name, context, (members) => {
            if (members.length > 0) {
                return context.message.channel.send('Member already exist.')
            } else {
                Repo.Insert([name], ['name'], 'members', (error, success) => {
                    if (error) {
                        return context.message.channel.send(error)
                    }
                    context.message.channel.send(`${name} has been successfully added as member!`)
                })
            }
        })
    }

    static listMember(context, delim) {
        Repo.SelectAll('members', (error, rows) => {
            if (error) {
                return context.message.channel.send(error)
            }

            if (rows.length <= 0) {
                context.message.channel.send('There are no members.')
            } else {
                let members = [];
                rows.forEach(row => members.push(row.name))

                context.message.channel.send(
                    'There are ' + members.length + ' members:\n' +
                    members.sort(
                        /*(x,y) => x.toLowerCase().localeCompare(y.toLowerCase())*/
                        ).join(delim ? delim + ' ' : '\n')
                )
            }
        })
    }

    static removeMember(name, context) {
        this.findMember(name, context, (members) => {
            if (members.length <= 0) {
                return context.message.channel.send('Member does not exist.')
            } else {
                Repo.Delete([name], ['name'], 'members', (error, success) => {
                    if (error) {
                        return context.message.channel.send(error)
                    }
                    context.message.channel.send(`${name} has been removed from clan.`)
                })
            }
        })
    }

    static findMember(name, context, callback) {
        Repo.Select(['name'], 'members', ['name'], [name], (error, result) => {
            if (error) {
                console.log(error)
                return context.message.channel.send(error)
            }
            callback(result)
        })
    }
}

module.exports = MembersPersistency