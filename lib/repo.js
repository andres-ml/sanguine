var Pg = require('pg')

const DATABASE = require.main.require('./config.json').dbUrl
const local = 'postgres://sg:sguard@localhost/sguard'

class Repo {

    static Delete(values, columns, table) {
        return new Promise((resolve, reject) => {
            Pg.connect(DATABASE, (error, client, done) => {
                if (error) {
                    console.log(error)
                    return reject(error.name)
                }

                let where = columns.map((column, i) => `${column}=$${i+1}`).join(' AND ')
                let query = `DELETE FROM ${table} WHERE ${where}`

                client.query(query, values, (err, result) => {
                    done()

                    if (err) {
                        console.log(err)
                        return reject(err.name)
                    }
                    resolve(result)
                })
            })
        })
    }

    static Insert(values, columns, table) {
        return new Promise((resolve, reject) => {
            Pg.connect(DATABASE, (error, client, done) => {
                if (error) {
                    console.log(error)
                    return reject(error.name)
                }

                let valueStr = Array.from(new Array(columns.length),(v, i) => i+1)
                    .map((i) => `$${i}`).join(',')
                let query = `INSERT INTO ${table} (${columns.join(',')}) VALUES(${valueStr})`

                client.query(query, values, (err, result) => {
                    done()

                    if (err) {
                        console.log(err)
                        return reject(err.name)
                    }
                    resolve(result)
                })
            })
        })
    }

    static Select(columns, table, wheres, values) {
        return new Promise((resolve, reject) => {
            Pg.connect(DATABASE, (error, client, done) => {
                if (error) {
                    console.log(error)
                    return reject(error.name)
                }

                let select = columns && columns.length > 0 ?
                    columns.join(', ') : '*'

                let query = `SELECT ${select} FROM ${table}`
                let where = this.makeWhereClause(wheres, values)

                if (where) {
                    client.query(query + where, values, (err, result) => {
                        done()

                        if (err) {
                            console.log(err)
                            return reject(err.name)
                        }
                        resolve(result.rows)
                    })
                } else {
                    client.query(query, (err, result) => {
                        done()

                        if (err) {
                            console.log(err)
                            return reject(err.name)
                        }
                        resolve(result.rows)
                    })
                }
            })
        })
    }

    static SelectAll(table) {
        return new Promise((resolve, reject) => {
            Pg.connect(DATABASE, (error, client, done) => {
                if (error) {
                    console.log(error)
                    return reject(error.name)
                }

                let query = `SELECT * FROM ${table}`;
                client.query(query, (err, result) => {
                    done()

                    if (err) reject(err.name)
                    else resolve(result.rows)
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

module.exports = Repo