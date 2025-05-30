const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8000;
const compression = require('compression');
const corsOptions = {
  origin: ["https://moneywiseapp.vercel.app/", "http://localhost:4200"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(compression());
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

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

const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
const CUSTOM_JS = [
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js",
];

// Serve Swagger documentation
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpec, { customCssUrl: CSS_URL, customJs: CUSTOM_JS })
);

require("./app/routes")(app, db);

app.get("/", (req, res) => {
  res.status(200);
  res.json({ status: "OK", message: "Api is Running !!" });
});

app.listen(port, () => console.info(`Running on ${port}`));

module.exports = app;
