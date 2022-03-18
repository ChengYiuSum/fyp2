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
            req.session.cardNum = user.cardNum;
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
            req.session.cardNum = user.cardNum;
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
        var thatUser = await User.findOne(req.params.id);

        if (!thatUser) return res.notFound();

        if (req.method == "GET") {

            return res.view('user/wallet', { user: thatUser });

        } else {
            await User.updateOne(req.params.id).set({
                cardType: req.body.cardType,
                cardNum: req.body.cardNum
            })

            // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
            console.log('req.body.cardType: ' + req.body.cardType)
            // console.log('req.body.cardNum: ' + req.body.cardNum)

            req.session.cardType = req.body.cardType;

            req.session.cardNum = req.body.cardNum;

            // console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
            console.log('req.session.cardType: ' + req.session.cardType)
            console.log('req.session.cardNum: ' + req.session.cardNum)

            return res.redirect('/user/wallet/' + req.session.userid);
        }
    },

    update_wallet: async function (req, res) {

        var updatedMWallet = await User.updateOne(req.params.id).set({ cardType: req.body.cardType, cardNum: req.body.cardNum, value: 0 });

        if (!updatedMWallet) return res.notFound();

        req.session.cardType = req.body.cardType;

        req.session.cardNum = req.body.cardNum;

        req.session.value = 0;

        return res.redirect('/user/wallet/' + req.params.id);

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
        if (req.method == "GET") {
            return res.view('user/purchase', { products: user.products, user: user });
        }

        var record = await Record.create(req.body).fetch();

        return res.redirect('/user/record');
    },

    record: async function (req, res) {
        var record = await User.findOne(req.session.userid).populate("records");

        // record = record.records[record.length - 1]

        // console.log(record)
        // console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~")
        // console.log(record.records[record.records.length - 1])

        if (req.method == "GET") {

            var count = 0
            var list = 1
            var total = 0.0
            var price = 0.0

            if (typeof record.records[record.records.length - 1].price === 'string') {
                price = record.records[record.records.length - 1].price.substring(1);
                total = parseFloat(price) * parseInt(record.records[record.records.length - 1].quantity)
            } else {
                for (var i = 0; i < record.records[record.records.length - 1].price.length; i++) {
                    price = record.records[record.records.length - 1].price[i].substring(1);
                    total += parseFloat(price) * parseInt(record.records[record.records.length - 1].quantity[i])
                }
            }

            total = total.toFixed(1)

            console.log("Record:")
            console.log(record)

            return res.view('user/record', { record: record.records[record.records.length - 1], count: count, list: list, total: total });
        } else {

            var payment = await Payment.create(req.body).fetch();

            console.log(req.body.method)

            console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
            console.log(payment)

            return res.redirect('/user/payment')
        }
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

    remove_card: async function (req, res) {
        var thatUser = await User.findOne(req.session.userid);

        if (!thatUser) return res.status(404).json("User not found.");

        await User.updateOne(req.session.userid).set({ cardType: "", cardNum: "" });

        req.session.cardNum = "";

        req.session.cardType = "";

        return res.ok();
    },

    payment: async function (req, res) {
        var user = await User.findOne(req.session.userid).populate("records");

        var payment = await User.findOne(req.session.userid).populate("payments");


        if (req.method == "GET") {

            return res.view('user/payment', { user: user, payment: payment });

        }

        // var purchase = await Purchase.create(req.body).fetch();

        // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        // console.log(purchase)

        var product = await User.findOne(req.session.userid).populate("products");

        if (product.products.length > 1) {
            for (var i = 0; i < product.products.length; i++) {
                await User.removeFromCollection(req.session.userid, "products").members(product.products[i].id);
            }
        } else {
            await User.removeFromCollection(req.session.userid, "products").members(product.products[0].id);
        }

        // var test = await Payment.create(req.body).fetch();

        // console.log(test)

        if (test.method == "ownValue") {
            if (payment.payments[payment.payments.length - 1].total > req.session.value) {
                return res.status(401).json("You have not enough money in your account!\n1. Please add money to your account.\n2. Please pay by credit card.")
            } else {
                await User.updateOne(req.session.userid).set({ value: user.value.toFixed(1) - payment.payments[payment.payments.length - 1].total.toFixed(1) });
                req.session.value = user.value.toFixed(1) - payment.payments[payment.payments.length - 1].total.toFixed(1)
                return res.ok()
            }
        } else {
            return res.ok()
        }
    },

    test: async function (req, res) {
        return res.view('user/test')
    }
};

// action need equal to route