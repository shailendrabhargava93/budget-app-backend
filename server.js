const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({ extended: true }));

const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

//setup firebase
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
//initialize app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//database reference
let db = admin.firestore();

// Serve Swagger documentation
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

require("./app/routes")(app, db);

app.get("/", () => res.send("App is running !!"));

app.listen(port, () => console.info(`Running on ${port}`));

module.exports = app;
