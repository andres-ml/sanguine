var Repo = require.main.require('./lib/repo.js')

class MembersPersistency {

    static addMember(name) {
        return new Promise((resolve, reject) => {
            this.findMember(name)
                .then(members => {
                    if (members.length > 0) return reject('Member already exist.')
                    else Repo.Insert([name], ['name'], 'members')
                        .then(result => resolve(`${name} has been successfully added as member!`))
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))
        })
    }

    static listMembers(delim) {
        return new Promise((resolve, reject) => {
            Repo.SelectAll('members')
                .then(rows => {
                    if (rows.length <= 0) reject('There are no members.')
                    else {
                        let members = Array.from(rows, (row, i) => row.name)

                        resolve(
                            `There are ${members.length} members:\n` +
                            members.sort(
                                /*(x,y) => x.toLowerCase().localeCompare(y.toLowerCase())*/
                            ).join(delim ? delim + ' ' : '\n')
                        )
                    }
                })
                .catch(error => reject(error))
        })
    }

    static removeMember(name, context) {
        return new Promise((resolve, reject) => {
            this.findMember(name, context)
                .then(members => {
                    if (members.length <= 0) return reject('Member does not exist.')
                    else Repo.Delete([name], ['name'], 'members')
                        .then(result => resolve(`${name} has been removed from clan.`))
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))
        })
    }

    static findMember(name) {
        return new Promise((resolve, reject) => {
            Repo.Select(['name'], 'members', ['name'], [name])
                .then(members => resolve(members))
                .catch(error => reject(error))
        })
    }
}

module.exports = MembersPersistency