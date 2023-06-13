const express = require("express");
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
var jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT||5000

app.use(express.json());
app.use(cors());


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send({ error: true, message: 'unauthorization token' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: true, message: 'unathorized access' })
      }
      req.decoded = decoded;
      next();
    })
  }

const uri =
  "mongodb+srv://MusiQuest:71zWe9DUSL554MyR@cluster0.uld9vql.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db("MusiQuest").collection("users");
    const classesCollection = client.db("MusiQuest").collection("Classes");
    const instructorsCollection = client.db("MusiQuest").collection("Instructors");
      
      
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({token})
        })
      
        // const verifyAdmin = async (req, res, next) => {
        //     const email = req.decoded.email;
        //     const query = { email: email };
        //     const user = await usersCollection.findOne(query);
        //     if (user?.role !== 'admin') {
        //       return res.status(403).send({ error: true, message: 'forbidden message' });
        //     }
        //     next();
        //   }

    app.get("/users", async (req, res) => {
          const result =await usersCollection.find().toArray();
        res.send(result)
    })
    app.post("/users", async (req, res) => {
      const data = req.body;
      const query = { email: data.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(data);
      res.send(result);
    });
    
      app.patch('/users/admin/:id', async (req, res) => {
          const id = req.params.id;
          console.log(id)
          const filter = { _id: new ObjectId(id) };
          const options = { upsert: true };
          const updateDoc = {
              $set: {
                  role:'admin'
              },
          }
          const result = await usersCollection.updateOne(filter, updateDoc, options);
          res.send(result)
    })
      

    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
    app.post('/')
    app.get("/instructors", async (req, res) => {
        const result = await instructorsCollection.find().toArray();
        res.send(result);
      });
  

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("MusiQuest Running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
