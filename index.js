const express =require("express");
const app =express();
const port =3000;


const {initializeApp, cert} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

var serviceAccount = require("./key.json");

initializeApp({
    credential: cert(serviceAccount),

});
const db = getFirestore();


app.set('view engine','ejs')

app.get("/",(req,res) => {
    res.render("main");
});

app.get("/signin",(req,res) => {
    res.render("signin");
});

app.get("/signinsubmit", (req, res) => {
    const email_id = req.query.email_id;
    const password = req.query.password;

    db.collection('dolphin').where("email", "==", email_id).where("password", "==", password).get()
        .then((docs) => {
            if (docs.size > 0) {
                const user = docs.docs[0].data();
                const full_name = user.full_name;
                res.render("aft_login", { full_name: full_name });
            } else {
                res.send("wrong credentials");
            }
        })
        .catch((error) => {
            console.error("Error retrieving user data: ", error);
            res.status(500).send("Internal Server Error");
        });
});


app.get("/signupsubmit", (req, res) => {
    const full_name = req.query.full_name;
    const last_name = req.query.last_name;
    const email_id = req.query.email_id;
    const password = req.query.password;

    const usersRef = db.collection('dolphin');

    // Check for existing email or password
    usersRef.where('email', '==', email_id).get()
        .then(snapshot => {
            if (!snapshot.empty) {
                // Email already exists
                return res.redirect('/signup?error=email_exists');
            } else {
                return usersRef.where('password', '==', password).get();
            }
        })
        .then(snapshot => {
            if (snapshot && !snapshot.empty) {
                // Password already exists
                return res.redirect('/signup?error=password_exists');
            } else {
                // Neither email nor password exists, proceed to add the new user
                return usersRef.add({
                    full_name: full_name + ' ' + last_name,  // Concatenating full name and last name
                    email: email_id,
                    password: password,
                });
            }
        })
        .then(() => {
            // Successfully added user
            res.render("aft_login", { full_name: full_name });
        })
        .catch(error => {
            console.error("Error checking existing users or adding new user: ", error);
            res.status(500).send("Internal Server Error");
        });
});


app.get("/signup",(req,res) => {
    res.render("signup");
});

app.listen(port,() => {
    console.log('example app is listening on port ${port}');
});