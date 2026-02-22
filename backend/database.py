import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")

if not MONGO_URI or not MONGO_DB_NAME:
    raise RuntimeError("FATAL ERROR: MONGO_URI and MONGO_DB_NAME must be set in the .env file")

# We are adding a serverSelectionTimeoutMS of 5000 milliseconds (5 seconds)
TIMEOUT_MS = 5000

try:
    print("Attempting to connect to MongoDB...")
    # --- 1. ADD THE TIMEOUT TO THE CLIENT ---
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=TIMEOUT_MS)
    
    # 2. The ping command will now respect the timeout
    client.admin.command('ping')
    print("✅ MongoDB connection successful.")

# --- 3. CATCH the specific timeout error ---
except ServerSelectionTimeoutError as e:
    print(f"❌ MongoDB connection TIMED OUT after {TIMEOUT_MS}ms.")
    print("   This can be a problem with your connection string, DNS, or a network issue.")
    raise RuntimeError(f"Could not connect to MongoDB: {e}")
except ConnectionFailure as e:
    print(f"❌ MongoDB connection FAILED.")
    print("   This is often an issue with incorrect credentials in your connection string.")
    raise RuntimeError(f"Could not connect to MongoDB: {e}")

db = client[MONGO_DB_NAME]