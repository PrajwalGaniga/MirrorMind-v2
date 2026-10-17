import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

MONGO_URI = "mongodb+srv://zenlogdatabase:zenlogpass@zenlog.qhcnaoq.mongodb.net/?appName=ZenLog"

def test_connection_and_create_collection():
    print("Connecting to MongoDB Atlas cluster...")
    try:
        # Establish connection with 7 second timeout
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=7000)
        
        # Verify connection with ping
        ping_result = client.admin.command("ping")
        print(" Ping successful! Connection established with MongoDB cluster:", ping_result)
        
        # Check existing databases
        dbs = client.list_database_names()
        print(f" Existing databases in cluster: {dbs}")
        
        # Select or create the database for MirrorMind
        # We will use 'mirrormind_db'
        db = client["mirrormind_db"]
        
        # Create or access collection 'mirrormind'
        collection_name = "mirrormind"
        if collection_name not in db.list_collection_names():
            collection = db.create_collection(collection_name)
            print(f" Created new collection '{collection_name}' in database 'mirrormind_db'!")
        else:
            collection = db[collection_name]
            print(f" Collection '{collection_name}' already exists in 'mirrormind_db'.")
            
        # Insert a setup validation document
        test_doc = {
            "app": "MirrorMind v2",
            "status": "connected",
            "message": "Initial collection and connection test successful",
            "timestamp": "2026-10-16T14:19:00Z"
        }
        insert_result = collection.insert_one(test_doc)
        print(f" Successfully inserted initial document! _id: {insert_result.inserted_id}")
        
        # Retrieve document to verify read operation
        doc = collection.find_one({"_id": insert_result.inserted_id})
        print(f" Retrieved document from '{collection_name}' collection:")
        print("  ", doc)
        
        # List updated collections
        print(f" Collections in 'mirrormind_db': {db.list_collection_names()}")
        print("\n ALL CHECKS PASSED: MongoDB connection & collection creation succeeded!")

    except (ConnectionFailure, ServerSelectionTimeoutError) as err:
        print("\n MongoDB Connection Failed:", err)
        sys.exit(1)
    except Exception as e:
        print("\n An error occurred:", type(e).__name__, e)
        sys.exit(1)

if __name__ == "__main__":
    test_connection_and_create_collection()
