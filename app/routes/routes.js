module.exports = function (app, db) {
  //collection init
  let txns = db.collection("transactions");
  const { v4: uuidv4 } = require("uuid");

  /**
   * @swagger
   * /create:
   *   post:
   *      description: Used to add Transaction
   *      tags:
   *          - Manage Txn
   *      summary: create new txn
   *      requestBody:
   *          content:
   *              application/json:
   *                  schema:
   *                      type: object
   *                      required:
   *                          - title
   *                          - amount
   *                          - category
   *                          - date
   *                      properties:
   *                          title:
   *                              type: string
   *                          amount:
   *                              type: number
   *                              format: double
   *                          category:
   *                              type: string
   *                          date:
   *                              type: string
   *                              format: date
   *      responses:
   *          '200':
   *              description: Txn added successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.post("/create", async (req, res) => {
    let uuid = uuidv4();
    let docRef = txns.doc(uuid);
    console.info(req.body);
    await docRef.set({
      title: req.body.title,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date,
    });
    res.status(200).json("create success");
  });

  //get all txns
  /**
   * @swagger
   * /getall:
   *   get:
   *      description: Used to Get All Transaction
   *      tags:
   *          - Manage Txn
   *      summary: get all txns
   *      responses:
   *          '200':
   *              description: Txn added successfully
   *          '500':
   *              description: Internal server error
   *
   */
  app.get("/getall", async (req, res) => {
    const txnRef = txns;
    const snapshot = await txnRef.get();
    var txnArray = [];
    snapshot.forEach((doc) => {
      txnArray.push({ id: doc.id, data: doc.data() });
    });
    res.status(200).json(txnArray);
  });

  //get any txn by id
  /**
   * @swagger
   * '/txn/{id}':
   *  get:
   *     tags:
   *        - Manage Txn
   *     summary: get any txn by id
   *     parameters:
   *      - name: id
   *        in: path
   *        description: The id of the txn
   *        required: true
   *        type: string
   *     responses:
   *      200:
   *        description: Fetched Successfully
   *      500:
   *        description: Internal Server Error
   */

  app.get("/txn/:id", async (req, res) => {
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

  /**
   * @swagger
   * /update/{id}:
   *   put:
   *      description: Used to update Transaction
   *      tags:
   *          - Manage Txn
   *      summary: update any txn by id
   *      parameters:
   *        - in: path
   *          name: id
   *          description: The id of the txn
   *          required: true
   *          type: string
   *      requestBody:
   *          content:
   *              application/json:
   *                  schema:
   *                      type: object
   *                      required:
   *                          - title
   *                          - amount
   *                          - category
   *                          - date
   *                      properties:
   *                          title:
   *                              type: string
   *                          amount:
   *                              type: number
   *                              format: double
   *                          category:
   *                              type: string
   *                          date:
   *                              type: string
   *                              format: date
   *      responses:
   *          '200':
   *              description: Txn added successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.put("/update/:id", async (req, res) => {
    const txnId = req.params.id;
    console.log(txnId, req.body);
    let docRef = txns.doc(txnId);
    console.log(docRef);
    await docRef.set({
      title: req.body.title,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date,
    });
    res.send("update success");
  });
};
