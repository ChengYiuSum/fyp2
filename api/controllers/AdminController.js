/**
 * AdminController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    valuePreview: async function (req, res) {
        if (req.wantsJSON) {

            var offset = Math.max(req.query.offset, 0) || 0;

            var limitColum = 10;

            var value_form = await Value.find({
                where: { status: "" },
                sort: 'id DESC',
                limit: limitColum,
                skip: offset,
            }).populate("user_record");

            return res.json(value_form);	    // for ajax request

        } else {

            // var search = req.query.search || req.query.myInput || "";
            // var offset = Math.max(req.query.offset, 0) || 0;
            // var limitColum = 10;

            var count = await Value.count()

            // if no record, return nothing 
            if (count == 0) {
                var value_form = await Value.find()
                return res.view('admin/value', { forms: value_form, numOfRecords: count });
            }


            // find all records
            var all = await Value.find({
                sort: 'id DESC',
            }).populate("user_record");

            return res.view('admin/value', { forms: all, numOfRecords: count });


            // only output 10 records for each request
            // var i;
            // var cnt = 0;
            // var CollectedForm = [10];
            // for (i = offset; i < offset + 10; i++) {
            //     if (i < filterForms.length) {
            //         CollectedForm[cnt] = filterForms[i];
            //     } else {
            //         break;
            //     }
            //     cnt++;
            // }

            // return res.view('admin/value', { forms: CollectedForm, numOfRecords: count, offset: offset });

        }
    },

    approve: async function (req, res) {

        var thatValueAdded = await Value.findOne(req.params.id).populate("user_record");

        if (!thatValueAdded) return res.notFound();

        var thatUser = await User.findOne(thatValueAdded.user_record[0].id)

        if (!thatUser) return res.notFound();

        // console.log("testing");
        // console.log(thatCoachPaymentForm.id);

        // console.log("testing2");
        // console.log(thatCoachPaymentForm);

        await User.updateOne(thatValueAdded.user_record[0].id).set({
            value: thatUser.value + parseInt(thatValueAdded.value)
        });

        await Value.removeFromCollection(req.params.id, "user_record").members(thatValueAdded.user_record[0].id);
        await Value.destroyOne(req.params.id);

        return res.ok();
    },

    populate_value_record: async function (req, res) {

        var value = await Value.find().populate("user_record");

        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log(value)

        if (!value) return res.notFound();

        return res.json(value);
    },

};

