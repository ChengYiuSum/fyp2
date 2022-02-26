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
            }).populate("admin_record");

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
            }).populate("admin_record");

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

        var thatValueAdded = await User.findOne(req.params.id).populate("admin_record");

        if (!thatValueAdded) return res.notFound();

        // console.log("testing");
        // console.log(thatCoachPaymentForm.id);

        // console.log("testing2");
        // console.log(thatCoachPaymentForm);

        // await User.updateOne(thatValueAdded.id).set({ status: "Approved" });

        return res.ok();
    },

    populate_value_record: async function (req, res) {

        var value = await Admin.findOne(req.session.userid).populate("admin_record");

        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log(value)

        if (!value) return res.notFound();

        return res.json(value);
    },

};

