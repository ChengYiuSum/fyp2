/**
 * ValueController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    addValue: async function (req, res) {

        var value_record = await Value.create(req.body).fetch();

        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log(value_record)

        var user = await User.findOne(req.session.userid);
        await User.addToCollection(user.id, "value_record").members(value_record.id)

        return res.redirect('/user/wallet/' + req.session.userid);

    }
}



