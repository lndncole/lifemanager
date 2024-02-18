require('dotenv').config({ path: '../../.env' });
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGO_UN}:${process.env.MONGO_PW}@lifemngr-website.bbhe50q.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //Issuing commands to the admin db gives you global information
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    //List DB's / collections (db's are the same as collections)
    // const databases = await client.db("admin").command( { listDatabases: 1 } );


    //Create db - If the database doesn’t exist yet, it will be created.
    const db = client.db('users');

    //Create or select collection
    const collection = db.collection('unser_info');


    //Find entry in db
    const name = 'John Smith';
    // const foundEntry = await collection.find({ name }).toArray();
    // console.log(foundEntry);


    //Add entry to db 
    const testData = {
      name: 'John Smith',
      email: 'john.smith@gmail.com',
      profilePicUrl: 'www.google.com/profilepicurl/johnsmith'
    };
    // const insertOne = await collection.insertOne(testData);
    // console.log(insertOne);


    //Delete entry from db
    const deletedEntry = await collection.deleteMany({ name });
    console.log(deletedEntry);

    //Update entry in db
    // const updatedEntry = await collection.updateMany(
    //   { name },
    //   { $set: { birthdate: 'jan 4, 1987'} }
    // );
    // console.log(updatedEntry);








  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run();
module.exports = { run }
