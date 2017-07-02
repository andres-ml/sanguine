var Database = require('./database.js')

class Guild {

    static addMember(name) {
        return new Promise((resolve, reject) => {
            this.findMember(name)
                .then(members => {
                    if (members.length > 0) return reject('Member already exists.')
                    else Database.insert([name], ['name'], 'members')
                        .then(result => resolve(`${name} has been successfully added as member!`))
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))
        })
    }

    static getMembers() {
        return new Promise((resolve, reject) => {
            Database.selectAll('members')
                .then(result => {
                    let rows = result.rows
                    if (rows.length <= 0) reject('There are no members.')
                    else {
                        resolve(Array.from(rows, (row, i) => row.name))
                    }
                })
                .catch(error => reject(error))
        })
    }

    static removeMember(name, context) {
        return new Promise((resolve, reject) => {
            this.findMember(name, context)
                .then(members => {
                    if (members.length === 0) return reject('Member does not exist.')
                    else Database.delete([name], ['name'], 'members')
                        .then(result => resolve(`${name} has been removed from clan.`))
                        .catch(error => reject(error))
                })
                .catch(error => reject(error))
        })
    }

    static findMember(name) {
        return new Promise((resolve, reject) => {
            Database.select(['name'], 'members', ['name'], [name])
                .then(result => resolve(result.rows))
                .catch(error => reject(error))
        })
    }
}

module.exports = Guild
