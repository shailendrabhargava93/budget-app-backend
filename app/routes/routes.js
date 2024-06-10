module.exports = function (app, db) {
  //collection init
  let txns = db.collection("transactions");
  let categories = db.collection("categories");
  let budgets = db.collection("budgets");
  const { v4: uuidv4 } = require("uuid");

  /**
   * @swagger
   * /create:
   *   post:
   *      description: Used to add Transaction
   *      tags:
   *          - Manage Transactions
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
   *          - Manage Transactions
   *      summary: get all txns
   *      responses:
   *          '200':
   *              description: fetched successfully
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
   *        - Manage Transactions
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
   *          - Manage Transactions
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
   *              description: Txn updated successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.put("/update/:id", async (req, res) => {
    const txnId = req.params.id;
    let docRef = txns.doc(txnId);
    await docRef.set({
      title: req.body.title,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date,
    });
    res.status(200).json("update success");
  });

  /**
   * @swagger
   * '/txn':
   *  get:
   *     tags:
   *        - Manage Transactions
   *     summary: get all txns by created by
   *     parameters:
   *      - name: createdBy
   *        in: query
   *        description: any created by person
   *        required: true
   *        type: string
   *     responses:
   *      200:
   *        description: Fetched Successfully
   *      500:
   *        description: Internal Server Error
   */

  app.get("/txn", async (req, res) => {
    var txnArray = [];
    const txnRef = txns;
    const responseMessage = "No matching transaction found.";
    if (req.query.createdBy !== null && req.query.createdBy !== "") {
      const createdQUery = await txnRef
        .where("createdBy", "==", req.query.createdBy)
        .get();
      if (createdQUery.empty) {
        res.status(200).json(responseMessage);
        return;
      }

      createdQUery.forEach((doc) => {
        txnArray.push({ id: doc.id, data: doc.data() });
      });
      res.status(200).json(txnArray);
    } else {
      res.status(200).json("Please provide valid paramter");
    }
  });

  /**
   * @swagger
   * /getcategories:
   *   get:
   *      description: Used to Get All Categories
   *      tags:
   *          - Manage Categories
   *      summary: get all categories
   *      responses:
   *          '200':
   *              description: fetched successfully
   *          '500':
   *              description: Internal server error
   *
   */
  app.get("/getcategories", async (req, res) => {
    const categoryRef = categories;
    const snapshot = await categoryRef.get();
    var array = [];
    snapshot.forEach((doc) => {
      array.push({ id: doc.id, data: doc.data() });
    });
    res.status(200).json(array);
  });

  /**
   * @swagger
   * /create-budget:
   *   post:
   *      description: Used to create budget
   *      tags:
   *          - Manage Budgets
   *      summary: create new budget
   *      requestBody:
   *          content:
   *              application/json:
   *                  schema:
   *                      type: object
   *                      required:
   *                          - name
   *                          - totalBudget
   *                          - startDate
   *                          - endDate
   *                          - createdBy
   *                      properties:
   *                          name:
   *                              type: string
   *                          totalBudget:
   *                              type: number
   *                              format: double
   *                          startDate:
   *                              type: string
   *                              format: date
   *                          endDate:
   *                              type: string
   *                              format: date
   *                          createdBy:
   *                              type: string
   *      responses:
   *          '200':
   *              description: Budget added successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.post("/create-budget", async (req, res) => {
    let uuid = uuidv4();
    let ref = budgets.doc(uuid);
    await ref.set({
      name: req.body.name,
      totalBudget: req.body.totalBudget,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      users: [req.body.createdBy]
    });
    res.status(200).json("create success");
  });

  /**
   * @swagger
   * /share/{id}/{email}:
   *   put:
   *      description: Used to share a budget
   *      tags:
   *          - Manage Budgets
   *      summary: share budget
   *      parameters:
   *        - in: path
   *          name: id
   *          description: The id of the budget
   *          required: true
   *          type: string
   *        - in: path
   *          name: email
   *          description: The email id of the person
   *          required: true
   *          type: string
   *      responses:
   *          '200':
   *              description: updated successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.put("/share/:id/:email", async (req, res) => {
    const budgetId = req.params.id;
    const emailId = req.params.email;
    let budgetRef = budgets.doc(budgetId);
    await budgetRef.set({
      users: [emailId],
    });
    res.status(200).json("shared success");
  });
};
