require('dotenv').config({ path: '../../.env' });
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGO_UN}:${process.env.MONGO_PW}@lifemngr-website.bbhe50q.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
async function getMongoClient() {
  const mongoClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try {
    await mongoClient.connect();
    
    return mongoClient;
  } catch(e) {
    console.error("Error connecting to mongo client: ", e);
    // Close the client if there's an error
    await mongoClient.close();
  }
}

async function query(command, dbObject, userDataObject, updateObject) {

  const client = await getMongoClient();

  try {
    //userDataObject is expected to be an object here with property of email, at the very least

    //Create db - If the database doesn’t exist yet, it will be created.
    const dbString = dbObject.db ? dbObject.db : 'users'; 
    const collectionString = dbObject.collection ? dbObject.collection : 'unser_info'; 

    //Connect to db, a db will be created if there isn't already a db for the passed in input 
    const db = client.db(dbString);
    //Create or select collection
    const collection = db.collection(collectionString);

    //Exmaple of what a userDataObjectObject looks like
    //  const testData = {
    //   name: 'John Smith',
    //   email: 'john.smith@gmail.com',
    //   googlePicture: 'www.google.com/profilepicurl/johnsmith',
    //   lastLoginTime: 2024-02-18T22:01:29.369+00:00
    // };

    //Get user id (email)
    const id = userDataObject.email;

    let result;

    switch (command.toLowerCase()) {
      case "add":
    
      //Here I'm usng the findAndModify function with the "upsert" method to "true". This allows for a couple of things:
      //- If the user doesn't exist, a record will be created for it.
      //- If the user does exist, then only the things that changed will be modified, 
      //In this case it will more than likely be the lastLoginTime
      result = await client.db("users").command(
          {
            findAndModify: collectionString,
            query: { email: id },
            update: { 
              //using one of Mongosh's keywords "set" with the "$" identifier 
              $set: { 
                name: userDataObject.name, 
                googlePicture: userDataObject.googlePicture, 
                lastLoginTime: new Date()
              }},
            new: true,
            upsert: true
          }
       )

        break;
      case "find":
        result = await collection.find(id).toArray();

        break;
      case "update":
        result = await collection.updateMany({ email: id },
          { $set: updateObject,
            $currentDate: { lastModified: true } 
          }
        );

        break;

      case "aggregate": 
        let key = Object.keys(updateObject)[0];
        let memory = updateObject[key];
        // Create the $addFields stage dynamically
        let addFieldsStage = {
          $addFields: {}
        };

        // Use bracket notation to set the dynamic field name and its value
        addFieldsStage.$addFields["memories." + key] = memory;

        result = await collection.aggregate( [
          {
            addFieldsStage
          }
        ] );

        break;
      case "delete":
        result = await collection.deleteMany(id);

        break;
      default:
        return "opperation not found.";
    }

    return result;

  } catch(e) {
    console.log("Error querying the Mondo DB database: ", e);
  } finally {
    await client.close();
  }
}

async function addMemories(memoriesToAdd) {
  const client = await getMongoClient(); // Assumes getMongoClient is a function that connects to MongoDB
  try {
    const db = client.db('users'); // Access the 'users' database
    const collection = db.collection('user_info'); // Access the 'user_info' collection
    const email = 'landon.metcalfweb@gmail.com'; // Specify the user's email to update

    // Loop through each memory to prepare it for the update operation
    const memoriesUpdates = memoriesToAdd.map((memory, i) => {
      const timestamp = new Date().toISOString();
      const memoryKey = `${timestamp}_${i}`; // Create a unique key for the memory
      return { key: memoryKey, value: memory }; // Construct the memory object
    });

    // Prepare the update operation to add all the new memories to the array
    const updateOperation = {
      $push: { memories: { $each: memoriesUpdates } }
    };

    // Execute the update operation for the user
    await collection.updateOne({ email: email }, updateOperation);

    console.log("Memories successfully added.");
  } catch (e) {
    console.error("Error adding memory:", e);
  } finally {
    await client.close(); // Ensure to close the client connection
  }
}

// Example memories to add
const memories = ['I like turtles', 'I live in seattle.'];

addMemories(memories);



async function testConnection() {
    try {
      const client = await getMongoClient();

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });

      //Issuing commands to the admin db gives you global information
      //List DB's / collections (db's are the same as collections)
      const databases = await client.db("admin").command( { listDatabases: 1 } );

      console.log("Here are the databases in your Mongo DB: ", databases);

      await client.close();
    } catch(e) {
      console.error("Error connecting to MongoDB: ", e);
    }
}

module.exports = { query, testConnection }
