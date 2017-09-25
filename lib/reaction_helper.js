const ReactionHelper = {
    /**
     * Adds 1..N with N <= 10 numeric reactions to a message
     *
     * @param {Discord.Message} message
     * @param {int} N
     */
    addNumericReactions(message, N) {
        const emojiMap = ReactionHelper.emojiMap
        // add number, and add the next one when promise ends to ensure sorted numbers
        let add = (message, index = 0) => {
            if (index < N) {
                let numberEmoji = emojiMap[index + 1]
                message.react(numberEmoji).then( _ => add(message, index + 1) )
            }
        }
        // add the first
        add(message, 0)
    },

    /**
     * Map of numbers to their corresponding unicode keycap string
     */
    emojiMap: {
        1: '1⃣', 2: '2⃣', 3: '3⃣', 4: '4⃣', 5: '5⃣',
        6: '6⃣', 7: '7⃣', 8: '8⃣', 9: '9⃣', 10: '🔟',
    }
}

module.exports = ReactionHelper
