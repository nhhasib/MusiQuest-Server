const express = require("express");
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
var jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
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
    const selectedClassCollection = client.db("MusiQuest").collection("selected");
    const paymentCollection = client.db("MusiQuest").collection('payments');
    const enrolledClassCollection = client.db('MusiQuest').collection('enrolledClass');
      
      
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({token})
        })
      
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
              return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
          }

    app.get("/allUsers",verifyJWT,verifyAdmin, async (req, res) => {
          const result =await usersCollection.find().toArray();
        res.send(result)
    })

    app.get('/user',verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
          const decodedEmail = req.decoded.email;
    if (email !== decodedEmail) {
      return res.status(403).send({ error: true, message: 'forbidden access' })
    }
    const query = { email: email };
    const result = await usersCollection.findOne(query);
    res.send(result);
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
      app.patch('/users/instructors/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id)
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                role:'instructor'
            },
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result)
      })
    
      app.patch('/users/students/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id)
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                role:'student'
            },
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result)
  })
      
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
      
    app.post('/classes', async (req, res) => {
          const data = req.body;
          const result = await classesCollection.insertOne(data);
          res.send(result)
    })
    app.patch('/classes/approve/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
           status:'approved'
        },
    }
      const result = await classesCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.patch('/classes/denied/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
           status:'denied'
        },
    }
      const result = await classesCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    app.patch('/classes/enrolled/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const updateDoc = {
        $set: {
          available: data.available,
          enrolled:data.enrolled
        },
      } 
      const result = await classesCollection.updateOne(query, updateDoc)
      res.send(result)
      console.log(result)
    })
    app.post('/classes/enrolled', async (req, res) => {
      const data = req.body;
      const result = await enrolledClassCollection.insertOne(data);
      res.send(result)
    })
    app.get('/classes/enrolled', async(req,res)=> {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const query = { email: email };
    const result = await enrolledClassCollection.find(query).toArray();
    res.send(result);
    })

    app.get('/popularClass',async (req, res) => {
      const result = await classesCollection.find().sort({ enrolled: -1 }).toArray();
      res.send(result)
    })
    
    app.get('/myClass',verifyJWT, async (req, res) => {
        const email = req.query.email;
        if (!email) {
            res.send([])
        }
        const decodedEmail = req.decoded.email;
    if (email !== decodedEmail) {
      return res.status(403).send({ error: true, message: 'forbidden access' })
    }

    const query = { email: email };
    const result = await classesCollection.find(query).toArray();
    res.send(result);
    })
      
    app.delete('/myClass/:id', async(req, res)=> {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await classesCollection.deleteOne(query);
        res.send(result)
    })    
      
      app.get('/selectedClass',verifyJWT, async (req, res) => {
          const email = req.query.email;
          if (!email) {
              res.send([])
          }
          const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email };
      const result = await selectedClassCollection.find(query).toArray();
      res.send(result);
      })
      
      app.post('/selectedClass', async (req, res) => {
        const data = req.body;
        const result = await selectedClassCollection.insertOne(data);
        res.send(result)
  })
    
      app.delete('/selectedClass/:id', async(req, res)=> {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await selectedClassCollection.deleteOne(query);
          res.send(result)
      })
    
    app.post("/create-payment-intent",verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "mxn",
        payment_method_types: ['card'],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    })
    
    app.get("/instructors", async (req, res) => {
        const result = await instructorsCollection.find().toArray();
        res.send(result);
    });

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);

      const query = { _id: { $in: payment.enrolledClassId.map(id => new ObjectId(id)) } }
      const deleteResult = await selectedClassCollection.deleteMany(query)
      res.send({ insertResult,deleteResult });
    })
    app.get('/myPayment', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/enrolled', async(req,res)=> {
      const email = req.query.email;
          if (!email) {
              res.send([])
          }
        const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'forbidden access' })
      }
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);

    })

  

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
