module.exports = function (app, db) {
  //collection init
  let txns = db.collection("transactions");
  let budgets = db.collection("budgets");
  const { v4: uuidv4 } = require("uuid");
  /**
   * @swagger
   * /txn/create:
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
   *                          - budgetId
   *                          - user
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
   *                          user:
   *                              type: string
   *                          budgetId:
   *                              type: string
   *      responses:
   *          '200':
   *              description: Txn added successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.post("/txn/create", async (req, res) => {
    let uuid = uuidv4();
    let txnRef = txns.doc(uuid);

    if (req.body.budgetId) {
      txnRef.set({
        title: req.body.title,
        amount: req.body.amount,
        category: req.body.category,
        date: req.body.date,
        createdBy: req.body.user,
        budgetId: req.body.budgetId,
      });
      res.status(200).json("create success");
    } else {
      res.status(400).json("Please provide valid parameters e.g budgetId");
    }
  });

  /**
   * @swagger
   * /txn/all/{email}/{page}:
   *  get:
   *     description: Used to Get All Transaction
   *     tags:
   *        - Manage Transactions
   *     summary: get all txns for specific user
   *     parameters:
   *      - name: email
   *        in: path
   *        description: email id of the user
   *        required: true
   *        type: string
   *      - name: page
   *        in: path
   *        description: page no
   *        required: true
   *        type: number
   *     responses:
   *      200:
   *        description: Fetched Successfully
   *      500:
   *        description: Internal Server Error
   */
  app.get("/txn/all/:email/:page", async (req, res) => {
    var txnArray = [];
    const budgetRef = budgets;
    const txnRef = txns;
    const email = req.params.email;
    const page = req.params.page;
    const snapshot = await budgetRef.get();

    if (email) {
      if (!snapshot.empty) {
        const queryOutput = await budgetRef
          .where("users", "array-contains", email)
          .where("status", "==", "active")
          .get();
        const budgetIds = [];
        if (!queryOutput.empty) {
          queryOutput.forEach((doc) => {
            budgetIds.push(doc.id);
          });
        }

        const firstRow = await txnRef
          .where("budgetId", "in", budgetIds)
          .orderBy("date", "desc")
          .limit(10);

        const snapshot = await firstRow.get();

        // Get the last document
        const lastElement = snapshot.docs[snapshot.docs.length - 1];

        const next = await txnRef
          .where("budgetId", "in", budgetIds)
          .orderBy("date", "desc")
          .startAfter(lastElement.data().date)
          .limit(10);

        const queryOutput2 = page > 1 ? await next.get() : await firstRow.get();

        if (!queryOutput2.empty) {
          queryOutput2.forEach((doc) => {
            txnArray.push({ id: doc.id, data: doc.data() });
          });
        }
        res.status(200).json(txnArray);
      } else {
        res.status(200).json(txnArray);
      }
    } else {
      res.status(400).json("Please provide valid parameters e.g email");
    }
  });

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
   * /txn/update/{id}:
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

  app.put("/txn/update/:id", async (req, res) => {
    const txnId = req.params.id;
    let txnRef = txns.doc(txnId);
    await txnRef.update(
      {
        title: req.body.title,
        amount: req.body.amount,
        category: req.body.category,
        date: req.body.date,
        createdBy: req.body.user,
        budgetId: req.body.budgetId,
      },
      { merge: true }
    );
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
    if (req.query !== null && req.query !== "") {
      const createdBy =
        req.query.createdBy !== null && req.query.createdBy !== ""
          ? req.query.createdBy
          : null;

      const queryOutput = await txnRef
        .where("createdBy", "==", createdBy)
        .get();
      if (queryOutput.empty) {
        res.status(200).json(responseMessage);
        return;
      }

      queryOutput.forEach((doc) => {
        txnArray.push({ id: doc.id, data: doc.data() });
      });
      res.status(200).json(txnArray);
    } else {
      res.status(400).json("Please provide valid paramter");
    }
  });

  /**********BUDGET ENDPOINTS***************/

  /**
   * @swagger
   * /budget/all/{email}:
   *   get:
   *      description: Used to find budgets for user
   *      tags:
   *          - Manage Budgets
   *      summary: get all budgets for user
   *      parameters:
   *        - in: path
   *          name: email
   *          description: The email of the user
   *          required: true
   *          type: string
   *      responses:
   *          '200':
   *              description: Fetched successfully
   *          '500':
   *              description: Internal server error
   *
   */
  app.get("/budget/all/:email", async (req, res) => {
    var array = [];
    const budgetRef = budgets;
    const txnRef = txns;
    const email = req.params.email;
    const queryOutput = await budgetRef
      .where("users", "array-contains", email)
      .where("status", "==", "active")
      .get();
    if (!queryOutput.empty) {
      for (let budget of queryOutput.docs) {
        let spentAmount = 0;
        const queryOutput2 = await txnRef
          .where("budgetId", "==", budget.id)
          .get();
        if (!queryOutput2.empty) {
          queryOutput2.forEach((txn) => {
            spentAmount = spentAmount + txn.data().amount;
          });
        }
        let budgetData = budget.data();
        budgetData.spentAmount = spentAmount;
        array.push({ id: budget.id, data: budgetData });
      }
    }
    res.status(200).json(array);
  });

  /**
   * @swagger
   * /budget/create:
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
   *                          - status
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
   *                          status:
   *                              type: string
   *      responses:
   *          '200':
   *              description: Budget added successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.post("/budget/create", async (req, res) => {
    let uuid = uuidv4();
    let ref = budgets.doc(uuid);
    await ref.set({
      name: req.body.name,
      totalBudget: req.body.totalBudget,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      createdBy: req.body.createdBy,
      users: [req.body.createdBy],
      status: req.body.status,
    });
    res.status(200).json("create success");
  });

  /**
   * @swagger
   * /budget/update/{id}:
   *   put:
   *      description: Used to update Budget
   *      tags:
   *          - Manage Budgets
   *      summary: update budget
   *      parameters:
   *        - in: path
   *          name: id
   *          description: The id of the budget
   *          required: true
   *          type: string
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
   *                          - status
   *                          - users
   *                      properties:
   *                          name:
   *                              type: string
   *                          totalBudget:
   *                              type: number
   *                              format: double
   *                          status:
   *                              type: string
   *                          startDate:
   *                              type: string
   *                              format: date
   *                          endDate:
   *                              type: string
   *                              format: date
   *                          users:
   *                              type: array
   *                              items:
   *                                type: string
   *      responses:
   *          '200':
   *              description: budget updated successfully
   *          '500':
   *              description: Internal server error
   *
   */

  app.put("/budget/update/:id", async (req, res) => {
    const budgetId = req.params.id;
    if (budgetId) {
      const budgetRef = budgets.doc(budgetId);
      const doc = await budgetRef.get();
      console.log(doc.data());
      if (doc.exists) {
        await budgetRef.update(
          {
            name: req.body.name ? req.body.name : doc.data().name,
            totalBudget: req.body.totalBudget
              ? req.body.totalBudget
              : doc.data().totalBudget,
            startDate: req.body.startDate
              ? req.body.startDate
              : doc.data().startDate,
            endDate: req.body.endDate ? req.body.endDate : doc.data().endDate,
            status: req.body.status ? req.body.status : doc.data().status,
            users: req.body.users ? req.body.users : doc.data().users,
            createdBy: doc.data().createdBy,
          },
          { merge: true }
        );
      }
      res.status(200).json("update success");
    } else {
      res.status(400).json("Please provide valid parameters");
    }
  });

  /**
   * @swagger
   * '/budget/{id}':
   *  get:
   *     tags:
   *        - Manage Budgets
   *     summary: get any budget by id
   *     parameters:
   *      - name: id
   *        in: path
   *        description: The id of the budget
   *        required: true
   *        type: string
   *     responses:
   *      200:
   *        description: Fetched Successfully
   *      500:
   *        description: Internal Server Error
   */

  app.get("/budget/:id", async (req, res) => {
    const budgetId = req.params.id;
    const budgetRef = budgets.doc(budgetId);
    const doc = await budgetRef.get();
    if (!doc.exists) {
      res.status(200).json("No such budget found!");
    } else {
      console.log("txn data:", doc.data());
      res.status(200).json(doc.data());
    }
  });
};
