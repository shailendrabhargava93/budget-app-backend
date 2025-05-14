module.exports = function (app, db) {
  //collection init
  let txns = db.collection("transactions");
  let budgets = db.collection("budgets");
  let labels = db.collection("labels");
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
        label: req.body.label,
      });
      res.status(200).json("create success");
    } else {
      res.status(400).json("Please provide valid parameters e.g budgetId");
    }
  });

  /**
   * @swagger
   * /txn/all/{email}/{page}/{count}:
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
   *      - name: count
   *        in: path
   *        description: no of records
   *        required: true
   *        type: number
   *     responses:
   *      200:
   *        description: Fetched Successfully
   *      500:
   *        description: Internal Server Error
   */
  app.get("/txn/all/:email/:page/:count", async (req, res) => {
    let txnArray = [];
    let max;
    const budgetRef = budgets;
    const txnRef = txns;
    const email = req.params.email;
    const page = req.params.page;
    const count = req.params.count ? Number(req.params.count) : 10;
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

        const maxRef = await txnRef
          .where("budgetId", "in", budgetIds)
          .orderBy("amount", "desc")
          .limit(1)
          .get();
        if (!maxRef.empty) {
          const dataRef = maxRef.docs ? maxRef.docs[0] : null;
          max = dataRef.data().amount;
        }

        const firstRow = await txnRef
          .where("budgetId", "in", budgetIds)
          .orderBy("date", "desc")
          .limit(count);

        const snapshot = await firstRow.get();

        // Get the last document
        const lastElement = snapshot.docs[snapshot.docs.length - 1];

        const next = await txnRef
          .where("budgetId", "in", budgetIds)
          .orderBy("date", "desc")
          .startAfter(lastElement.data().date)
          .limit(count);

        const queryOutput2 = page > 1 ? await next.get() : await firstRow.get();

        if (!queryOutput2.empty) {
          queryOutput2.forEach((doc) => {
            txnArray.push({ id: doc.id, data: doc.data() });
          });
        }
        res.status(200).json({ txns: txnArray, max: max });
      } else {
        res.status(200).json(txnArray);
      }
    } else {
      res.status(400).json("Please provide valid parameters e.g email");
    }
  });

  //filter
  /**
   * @swagger
   * /txn/filter:
   *   post:
   *      description: filter all transactions
   *      tags:
   *          - Manage Transactions
   *      summary: Filter Txns
   *      requestBody:
   *          content:
   *              application/json:
   *                  schema:
   *                      type: object
   *                      required:
   *                          - email
   *                          - categories
   *                          - min
   *                          - max
   *                      properties:
   *                          email:
   *                              type: string
   *                          min:
   *                              type: number
   *                              format: double
   *                          max:
   *                              type: number
   *                              format: double
   *                          categories:
   *                              type: array
   *                              items:
   *                                type: string
   *      responses:
   *          '200':
   *              description: Fetched successfully
   *          '500':
   *              description: Internal server error
   *
   */
  app.post("/txn/filter", async (req, res) => {
    var txnArray = [];
    const budgetRef = budgets;
    const txnRef = txns;
    const email = req.body.email;
    const categories = req.body.categories;
    const min = req.body.min;
    const max = req.body.max;

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

        let query = txnRef.where("budgetId", "in", budgetIds);

        if (categories && categories.length > 0) {
          query = query.where("category", "in", categories);
        }
        if (min) {
          query = query.where("amount", ">=", Number(min));
        }
        if (max) {
          query = query.where("amount", "<=", Number(max));
        }

        const queryOutput2 = await query.get();
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
        label: req.body.label
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
   * /budget/all/{email}/{status}:
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
   *        - in: path
   *          name: status
   *          description: status of budget
   *          required: true
   *          type: string
   *      responses:
   *          '200':
   *              description: Fetched successfully
   *          '500':
   *              description: Internal server error
   *
   */
  app.get("/budget/all/:email/:status", async (req, res) => {
    var array = [];
    const budgetRef = budgets;
    const txnRef = txns;
    const email = req.params.email;
    const status = req.params.status;
    const queryOutput = await budgetRef
      .where("users", "array-contains", email)
      .where("status", "==", status)
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
      let spentAmount = 0;
      const queryOutput2 = await txns.where("budgetId", "==", doc.id).get();
      if (!queryOutput2.empty) {
        queryOutput2.forEach((txn) => {
          spentAmount = spentAmount + txn.data().amount;
        });
      }
      let budgetData = doc.data();
      budgetData.spentAmount = spentAmount;
      res.status(200).json(budgetData);
    }
  });

  /**
   * @swagger
   * '/budget/stats/{id}':
   *  get:
   *     tags:
   *        - Manage Budgets
   *     summary: get budget stats
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

  app.get("/budget/stats/:id", async (req, res) => {
    const budgetId = req.params.id;
    const budgetRef = budgets.doc(budgetId);
    const doc = await budgetRef.get();
    if (!doc.exists) {
      res.status(200).json("No such budget found!");
    } else {
      let txnList = [];
      const queryOutput2 = await txns.where("budgetId", "==", doc.id).get();
      if (!queryOutput2.empty) {
        queryOutput2.forEach((txn) => {
          txnList.push(txn.data());
        });
      }

      let result;
      if (txnList.length > 0) {
        const categoryTxnCount = {};
        const labelTxnCount = {};

        let count = 1;
        for (const transaction of txnList) {
          const category = transaction.category;
          const amount = transaction.amount;
          const label = transaction.label;

          if (category in categoryTxnCount) {
            categoryTxnCount[category] = {
              sumAmount: categoryTxnCount[category].sumAmount + amount,
              count: categoryTxnCount[category].count + 1,
            };
          } else {
            categoryTxnCount[category] = { sumAmount: amount, count: count };
          }

          if (label in labelTxnCount) {
            labelTxnCount[label] = {
              sumAmount: labelTxnCount[label].sumAmount + amount,
              count: labelTxnCount[label].count + 1,
            };
          } else {
            labelTxnCount[label] = { sumAmount: amount, count: count };
          }
        }

        const dateSum = {};

        for (const transaction of txnList) {
          const date = new Date(transaction.date);
          const moddate = date.toISOString().split("T")[0];
          const amount = transaction.amount;

          if (moddate in dateSum) {
            dateSum[moddate] += amount;
          } else {
            dateSum[moddate] = amount;
          }
        }

        const sortedKeys = Object.keys(dateSum).sort();
        let sortedData = {};
        for (let key of sortedKeys) {
          sortedData[key] = dateSum[key];
        }

        result = {
          datesData: sortedData,
          categoryTxnCount: categoryTxnCount,
          labelTxnCount: labelTxnCount
        };
      }
      res.status(200).json(result);
    }
  });

  //  LABELS
  /**
   * @swagger
   * /label/all/{email}:
   *   get:
   *      description: Used to find labels for user
   *      tags:
   *          - Manage Labels
   *      summary: get all labels for user
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
  app.get("/label/all/:email", async (req, res) => {
    var array = [];
    const labelsRef = labels;
    const email = req.params.email;
    const queryOutput = await labelsRef
      .where("users", "array-contains", email)
      .get();
    if (!queryOutput.empty) {
      for (let label of queryOutput.docs) {
        array = label.data().tags != null ? label.data().tags: [];
      }
    }
    res.status(200).json(array);
  });
};
