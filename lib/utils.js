var Utils = {

    /**
     * returns an array of captured groups from a regex, e.g:
     * Utils.matches("1foo 2bar", /1(\w)|2(\w)/g)
     * will yield ["foo", "bar"]
     */
    matches: (input, regex) => {
        let matches, output = []
        while (matches = regex.exec(input)) {
            let capture = matches.slice(1).filter(x => x != undefined)[0]
            output.push(capture)
        }
        return output
    }

}

module.exports = Utils
