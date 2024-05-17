const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({ extended: true }));

//setup firebase
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
//initialize app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//database reference
let db = admin.firestore();

require("./app/routes")(app, db);

app.listen(port, () => console.info(`Running on ${port}`));

module.exports = app;
