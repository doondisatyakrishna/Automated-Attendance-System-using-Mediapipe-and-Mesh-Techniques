import os
from dotenv import load_dotenv

load_dotenv()

# --- Add this temporary code for debugging ---
env_path = os.path.join(os.path.dirname(__file__), '.env')
is_loaded = load_dotenv(dotenv_path=env_path)
print(f"--- Attempting to load .env file from: {env_path} ---")
print(f"--- Was the .env file found and loaded? {is_loaded} ---")
print(f"--- MONGO_URI from environment: {os.getenv('MONGO_URI')} ---")
# --- End of debug code ---


from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from tasks.attendance_lazy import fill_absent_records

# --- Corrected Imports (remove 'backend.') ---
from routes import auth, students, attendance, recognition, analytics, profile, settings
from database import db

# --- App Initialization ---
app = FastAPI(title='Automated Attendance Backend')

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---
@app.get("/")
def health_check():
    """A simple health check to confirm the server is running."""
    return {"status": "OK", "message": "Automated Attendance Backend is running"}

@app.on_event("startup")
async def startup_event():
    # This will fill in absentees for all past days automatically
    fill_absent_records()

@app.get("/health")
def health_check_detailed():
    """A detailed health check that also tests the database connection."""
    try:
        db.admin.command('ping')
        return {"status": "OK", "database": "connected"}
    except Exception as e:
        return {"status": "ERROR", "database": "disconnected", "error": str(e)}

# --- Routers ---
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(recognition.router)
app.include_router(analytics.router)
app.include_router(profile.router)
app.include_router(settings.router)

# --- Static Files ---
uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(uploads_dir, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=uploads_dir), name='uploads')