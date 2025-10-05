import uvicorn
import dotenv

if __name__ == "__main__":
    # Load the .env file before doing anything else.
    # This guarantees that all environment variables are available.
    print("--- Loading .env file from run.py ---")
    dotenv.load_dotenv()
    
    # Now, run the Uvicorn server programmatically
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )