const express = require("express");
const cors = require("cors")
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId
require('dotenv').config()

const app = express()
const port = process.env.PORT || 3001


// middleware 
app.use(cors({
    origin: "*",
})
)
app.use(express.json())

const uri = process.env.MONGO_CONNECTION;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => {
    res.send("server run kore beta...")
})

// add food api
async function run() {
    try {
        await client.connect()
        console.log("database connected and working...")
        const database = client.db("yoodo-hostel");
        const allUsersCollection = database.collection('Users')
        const allFoodCollection = database.collection("Food");
        const allStudentsCollection = database.collection("Student");
        const allDistributionCollection = database.collection("Distribution");


        // user/ client register 
        app.post("/clientregister", async (req, res) => {
            const client = { ...req.body, role: "client" };
            console.log(client);
            const result = await allUsersCollection.insertOne(client);
            res.json(result);
        });
        // Post Food API

        app.post('/foods', async (req, res) => {
            const result = await allFoodCollection.insertOne(req.body)
            res.send(result)
        })

        // Get all food api

        app.get('/foods', async (req, res) => {
            const cursor = allFoodCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let payload;
            const count = await cursor.count();

            if (page) {
                payload = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                payload = await cursor.toArray();
            }

            res.send({
                count,
                payload
            });
        })

        // get single food api
        app.get('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const payload = await allFoodCollection.findOne(query)
            res.send(payload)
        })

        // update food api
        app.put('/foods/:id', async (req, res) => {
            const food = req.body;
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = await { $set: { name: food.name, price: food.price } }
            const payload = await allFoodCollection.updateOne(query, updateDoc, options)
            res.send(payload)
        })

        // food delete api
        app.delete('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await allFoodCollection.deleteOne(query)
            res.send(result)
        })

        // add student api 
        app.post('/students', async (req, res) => {
            const roll = req.body.roll;
            const query = { roll: roll }
            const payload = await allStudentsCollection.findOne(query)
            if (payload) {
                res.send(payload)
            }
            else {
                const result = await allStudentsCollection.insertOne(req.body)
                res.send(result)
            }

        })

        // get all student 
        app.get('/students', async (req, res) => {
            const cursor = allStudentsCollection.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let payload;
            const count = await cursor.count();

            if (page) {
                payload = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                payload = await cursor.toArray();
            }

            res.send({
                count,
                payload
            });
        })

        // get single student
        app.get('/students/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const payload = await allStudentsCollection.findOne(query)
            res.send(payload)
        })


        // student update
        app.put('/students/:id', async (req, res) => {
            const student = req.body;
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = await { $set: { fullName: student.fullName, roll: student.roll, age: student.age, class: student.class, hall: student.hall } }
            const payload = await allStudentsCollection.updateOne(query, updateDoc, options)
            res.send(payload)
        })

        // student status update api 
        app.put(`/student/:id`, async (req, res) => {
            const id = req.params.id
            const status = req.query.status;
            const query = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = await { $set: { status: status } }
            const payload = await allStudentsCollection.updateOne(query, updateDoc, options)
            res.send(payload)
        })

        // student delete api
        app.delete('/students/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await allStudentsCollection.deleteOne(query)
            res.send(result)
        })

        // food serve api
        app.post('/foodserve', async (req, res) => {
            const roll = req.body.studentId;
            const shift = req.body.shift;
            let today = new Date().toLocaleDateString()
            const query = { studentId: roll }
            const result = await allDistributionCollection.findOne(query)
            let payload;
            if (result?.date === today && result?.shift === shift) {
                res.send({ message: "Already served", statusCode: 404 })
            }
            else {
                payload = await allDistributionCollection.insertOne(req.body)
                res.send(payload)
            }
        })
        // check admin
        app.get('/checkadmin/:email', async (req, res) => {
            const result = await allUsersCollection.findOne({ email: req.params.email });
            let isAdmin = false
            if (result?.role == 'admin') {
                isAdmin = true
            }
            res.send({ admin: isAdmin });
        });

    }
    finally {

    }
}
run().catch()


app.listen(port, () => {
    console.log("server running at port ", port);
})