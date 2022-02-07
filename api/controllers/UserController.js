/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    login: async function (req, res) {

        if (req.method == "GET") return res.view('user/login');

        if (!req.body.username || !req.body.password) return res.badRequest();

        var user = await User.findOne({ username: req.body.username });

        if (!user) return res.status(401).json("User not found");

        if (user.password != req.body.password)
            return res.status(401).json("Wrong Password");

        //var match = await sails.bcrypt.compare(req.body.password, user.password);

        //if (!match) return res.status(401).json("Wrong Password");

        // Reuse existing session 
        if (!req.session.username) {
            req.session.username = user.username;
            req.session.name = user.name;
            req.session.address = user.address;
            req.session.email = user.email;
            req.session.role = user.role;
            req.session.userid = user.id;
            req.session.value = user.value;
            return res.json(user);
            // return res.redirect('/');
        }

        // Start a new session for the new login user
        req.session.regenerate(function (err) {

            if (err) return res.serverError(err);

            req.session.username = user.username;
            req.session.name = user.name;
            req.session.address = user.address;
            req.session.email = user.email;
            req.session.role = user.role;
            req.session.userid = user.id;
            req.session.value = user.value;
            return res.json(user);
            // return res.redirect('/');
        });
    },

    logout: async function (req, res) {

        req.session.destroy(function (err) {

            if (err) return res.serverError(err);

            return res.ok();
        });
    },

    signUp: async function (req, res) {

        if (req.method == "GET") return res.view('user/signUp');

        var user = await User.findOne({ username: req.body.username });

        if (!user) {
            if (req.body.password == req.body.confirmedPassword) {
                await User.create(req.body).fetch();
                return res.status(300).json("Successfully signed up");
            } else {
                return res.status(401).json("Password not match")
            }
        } else if (user) {
            return res.status(401).json("Username has been used")
        }
    },

    json: async function (req, res) {

        var everyuser = await User.find();

        return res.json(everyuser);
    },

    account: async function (req, res) {
        if (req.method == "GET") {

            var thatUser = await User.findOne(req.params.id);

            if (!thatUser) return res.notFound();

            return res.view('user/account', { user: thatUser });
        }
    },

    wallet: async function (req, res) {
        if (req.method == "GET") {

            var thatUser = await User.findOne(req.params.id);

            if (!thatUser) return res.notFound();

            return res.view('user/wallet', { user: thatUser });
        }
    },

    value: async function (req, res) {
        var thatUser = await User.findOne(req.session.userid);

        if (!thatUser) return res.status(404).json("User not found.");

        if (req.method == "GET") {

            return res.view('user/value', { user: thatUser });
        }

        else {

            await User.updateOne(req.session.userid).set({ value: thatUser.value + parseInt(req.body.value) });

            return res.redirect('/user/wallet/' + req.session.userid);

        }
    },

    // return json of relationship
    populate: async function (req, res) {

        var user = await User.findOne(req.session.userid).populate("products");

        if (!user) return res.notFound();

        return res.json(user);
    },

    purchase: async function (req, res) {

        var user = await User.findOne(req.session.userid).populate("products");

        if (!user) return res.notFound();

        var count = 0;

        // if (req.wantsJSON) {
        //     return res.json(user.products);
        // } else {
        //     return res.view('user/purchase', { products: user.products, user: user });
        // }
        if (req.method == "GET") return res.view('user/purchase', { products: user.products, user: user });

        var record = await User.create(req.body).fetch();

        console.log(record.title.length)

        return res.view('user/record', { record: record });
    },


    add: async function (req, res) {
        var thatUser = await User.findOne(req.session.userid);

        if (!thatUser) return res.status(404).json("User not found.");

        var thatProduct = await PriceTracker.findOne(req.params.fk).populate("purchase", { id: req.session.userid });

        if (!thatProduct) return res.status(404).json("Product not found.");

        await User.addToCollection(req.session.userid, "products").members(req.params.fk);

        return res.ok();
    },

    remove: async function (req, res) {
        var thatUser = await User.findOne(req.session.userid);

        if (!thatUser) return res.status(404).json("User not found.");

        var thatProduct = await PriceTracker.findOne(req.params.fk).populate("purchase", { id: req.session.userid });

        if (!thatProduct) return res.status(404).json("Product not found.");

        if (thatProduct.purchase.length == 0)
            return res.status(409).json("Nothing to delete.");    // conflict

        await User.removeFromCollection(req.session.userid, "products").members(req.params.fk);

        return res.ok();
    },
};

// action need equal to route