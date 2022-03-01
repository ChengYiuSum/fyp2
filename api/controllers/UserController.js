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
            req.session.cardType = user.cardType;
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
            req.session.cardType = user.cardType;
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

    setting: async function (req, res) {
        if (req.method == "GET") return res.view('user/setting')

        return res.redirect('/priceTracker/homepage');
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
    populate_products: async function (req, res) {

        var user = await User.findOne(req.session.userid).populate("products");

        if (!user) return res.notFound();

        return res.json(user);
    },

    populate_preference: async function (req, res) {

        var user = await User.findOne(req.session.userid).populate("preferences");

        if (!user) return res.notFound();

        return res.json(user);
    },

    populate_record: async function (req, res) {

        var user = await User.findOne(req.session.userid).populate("records");

        if (!user) return res.notFound();

        return res.json(user);
    },

    populate_payment: async function (req, res) {

        var user = await User.findOne(req.session.userid).populate("payments");

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

        var record = await Record.create(req.body).fetch();

        var count = 0
        var list = 1
        var total = 0.0
        var price = 0.0

        if (typeof record.price === 'string') {
            price = record.price.substring(1);
            total = parseFloat(price)
        } else {
            for (var i = 0; i < record.price.length; i++) {
                price = record.price[i].substring(1);
                total += parseFloat(price) * parseInt(record.quantity[i])
            }
        }

        total = total.toFixed(1)

        console.log("Record:")
        console.log(record)

        return res.view('user/record', { record: record, count: count, list: list, total: total });
    },


    add: async function (req, res) {
        var thatUser = await User.findOne(req.session.userid);

        if (!thatUser) return res.status(404).json("User not found.");

        var thatProduct = await PriceTracker.findOne(req.params.fk).populate("purchase", { id: req.session.userid });

        if (!thatProduct) return res.status(404).json("Product not found.");

        var thatProductInCart = await User.findOne(req.session.userid).populate("products");

        for (var i = 0; i < thatProductInCart.products.length; i++) {
            if (thatProductInCart.products[i].id == req.params.fk) {
                return res.status(401).json("You have added. Please check your shopping cart!")
            }
        }

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

    payment: async function (req, res) {
        var payment = await Payment.create(req.body).fetch();

        if (req.method == "GET") return res.view('user/payment'), { payment: payment };



        // var payment = await Payment.create(req.body).fetch();

        // return res.redirect('/priceTracker/homepage');

        return res.view('user/payment', { payment: payment });
    }
};

// action need equal to route