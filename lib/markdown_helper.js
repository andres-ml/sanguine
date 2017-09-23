const dedent  = require('dedent-js')

var MarkdownHelper = {
    build: (body) => {
        const escape = '```'
        return dedent`${escape}Markdown
            ${body}
            ${escape}
        `
    }
}

module.exports = MarkdownHelper
