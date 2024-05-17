module.exports = function (app, db) {
  //collection init
  let txns = db.collection("transactions");
  const { v4: uuidv4 } = require("uuid");

  //create txn
  app.post("/create", async (req, res) => {
    let uuid = uuidv4();
    let docRef = txns.doc(uuid);
    console.info(req.body);
    await docRef.set({
      title: req.body.title,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date
    });
    res.status(200).json("create success");
  });

  //get all txns
  app.get("/getall", async (req, res) => {
    const txnRef = txns;
    const snapshot = await txnRef.get();
    var txnArray = [];
    snapshot.forEach((doc) => {
      txnArray.push({ id: doc.id, data: doc.data() });
      console.log(doc.id, "=>", doc.data());
    });
    res.status(200).json(txnArray);
  });

  //get one txn by id
  app.get("/gettxn/:id", async (req, res) => {
    const txnId = req.params.id;
    const txnRef = txns.doc(txnId);
    const doc = await txnRef.get();
    if (!doc.exists) {
      res.status(200).json("No such txn found!");
    } else {
      console.log("txn data:", doc.data());
      res.status(200).json(doc.data());
    }
  });

  //update txn
  app.put("/update/:id", async (req, res) => {
    const txnId = req.params.id;
    let docRef = txns.doc(txnId);
    await docRef.set({
      title: req.body.title,
      amount: req.body.amount,
      category: req.body.category,
    });
    res.send("update success");
  });
};
