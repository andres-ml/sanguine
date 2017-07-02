var Pg = require('pg')

const DATABASE = require.main.require('./config.json').database.url
const local = 'postgres://sg:sguard@localhost/sguard'

class Database {

    static delete(values, columns, table) {
        let where = columns.map((column, i) => `${column}=$${i+1}`).join(' AND ')
        let query = `DELETE FROM ${table} WHERE ${where}`
        return this.run(query, values)
    }

    static insert(values, columns, table) {
        let valueStr = Array.from(new Array(columns.length), (v, i) => i+1)
            .map((i) => `$${i}`).join(',')
        let query = `INSERT INTO ${table} (${columns.join(',')}) VALUES(${valueStr})`
        return this.run(query, values)
    }

    static select(columns, table, wheres, values) {
        let select = columns && columns.length > 0 ?
            columns.join(', ') : '*'

        let query = `SELECT ${select} FROM ${table}`
        let where = this.makeWhereClause(wheres, values)

        if (where) query += where

        return this.run(query, values)
    }

    static selectAll(table) {
        let query = `SELECT * FROM ${table}`
        return this.run(query)
    }

    static run(query, values = null) {
        return new Promise((resolve, reject) => {
            Pg.connect(DATABASE, (error, client, done) => {
                if (error) {
                    console.log(error)
                    return reject(error.name)
                }

                client.query(query, values, (error, result) => {
                    done()

                    if (error) {
                        console.log(error)
                        return reject(error.name)
                    }
                    resolve(result)
                })
            })
        })
    }

    static makeWhereClause(columns, values) {
        if (columns && values && columns.length > 0 && values.length > 0) {
            if (columns.length === values.length) {
                let wheres = []
                for (let i = 0; i < columns.length; i++) {
                    wheres.push(`UPPER(${columns[i]})=UPPER($${i+1})`)
                }
                return ` WHERE ${wheres.join(' AND ')}`
            } else {
                throw new Error('Where clause input mismatch.')
            }
        } else {
            return ''
        }
    }
}

module.exports = Database
