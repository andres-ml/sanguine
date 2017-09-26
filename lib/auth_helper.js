const AuthHelper = {

    /**
     * @param {Discord.User} user
     * @param {Discord.Guild} guild
     * @param {object} AuthObject
     */
     isAuthorized(user, guild, authOptions) {
         if ('roles' in authOptions) {
             // no server -- no roles
             if (guild === null) {
                 return false
             }

             const member = guild.members.find('id', user.id)
             if (member === null) {
                 return false
             }

             // filter command roles that the user has
             const matchingRoles = authOptions.roles.filter(roleName => member.roles.find('name', roleName) !== null)

             // reject if there are none
             if (matchingRoles.length === 0) {
                 return false
             }
         }

         return true
     }

}

module.exports = AuthHelper
