# Automated Attendance System using MediaPipe Face Mesh

> A full-stack AI-powered attendance management system that uses real-time facial recognition and facial landmark analysis to automate classroom attendance.

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)](https://www.mongodb.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face%20Mesh-4285F4?logo=google)](https://ai.google.dev/edge/mediapipe/solutions/guide)

## 📌 Overview

Traditional attendance systems rely heavily on manual processes such as roll calls, paper records, or manually maintained spreadsheets. These approaches are time-consuming and can be difficult to maintain at scale.

This project explores an AI-based alternative by using **computer vision and facial recognition** to identify students from a live camera feed and automatically record their attendance.

The system combines:

* **MediaPipe Face Mesh** for real-time facial landmark detection
* **Face recognition / facial embeddings** for identifying registered students
* **Liveness detection** to help distinguish a live person from a spoofed image
* **FastAPI** for the backend REST API
* **React** for the web interface
* **MongoDB** for storing student and attendance information

MediaPipe Face Mesh can estimate 468 3D facial landmarks from a camera input, making it suitable for real-time facial analysis.

---

## ✨ Features

### 👤 Student Management

* Register students with their personal and academic information
* Store student profile information and photographs
* Generate facial representations for recognition
* Manage registered students

### 🎥 Real-Time Face Recognition

* Capture faces from a live camera feed
* Detect faces in real time
* Extract facial features
* Compare detected faces against registered students
* Identify recognized students

### 👁️ Liveness Detection

The system includes a liveness-detection component intended to reduce simple spoofing attempts such as presenting a photograph to the camera.

The project uses facial information obtained from the camera feed as part of the liveness verification pipeline.

> **Note:** Liveness detection is a security layer, not a guarantee against every possible spoofing attack.

### 📊 Attendance Management

* Automatically record attendance for recognized students
* Store attendance timestamps
* Prevent unnecessary duplicate attendance entries
* View attendance records
* Support attendance reporting and statistics

### 🔐 Authentication

* Teacher / administrator authentication
* Password hashing
* JWT-based authentication
* Protected API endpoints

### 📈 Dashboard

The web dashboard provides a centralized interface for managing:

* Students
* Attendance
* Live recognition
* Reports
* Statistics

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │                      │
                    │  Dashboard           │
                    │  Student Management  │
                    │  Live Camera         │
                    │  Attendance Reports  │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    │       Backend        │
                    │                      │
                    │ Authentication       │
                    │ Student APIs         │
                    │ Attendance APIs      │
                    │ Recognition APIs     │
                    └───────┬───────┬──────┘
                            │       │
                 ┌──────────┘       └────────────┐
                 ▼                               ▼
        ┌─────────────────┐             ┌─────────────────┐
        │   Face / ML     │             │    MongoDB      │
        │    Pipeline     │             │                 │
        │                 │             │ Students        │
        │ MediaPipe       │             │ Attendance      │
        │ Face Mesh       │             │ Authentication  │
        │ Face Embeddings │             │ Records         │
        │ Liveness        │             └─────────────────┘
        └─────────────────┘
```

---

## 🔄 Attendance Workflow

```text
Student approaches camera
          │
          ▼
     Face detected
          │
          ▼
 MediaPipe Face Mesh
          │
          ▼
 Facial features extracted
          │
          ▼
 Face recognition
          │
     ┌────┴────┐
     │         │
 Unknown     Recognized
     │         │
     ▼         ▼
  Reject    Liveness check
               │
          ┌────┴────┐
          │         │
        Failed    Passed
          │         │
          ▼         ▼
        Reject   Mark attendance
                     │
                     ▼
                Store timestamp
                     │
                     ▼
                Update dashboard
```

---

## 🛠️ Tech Stack

| Layer             | Technology          |
| ----------------- | ------------------- |
| Frontend          | React               |
| Styling           | Tailwind CSS        |
| Backend           | Python, FastAPI     |
| Database          | MongoDB             |
| Computer Vision   | MediaPipe           |
| Face Analysis     | MediaPipe Face Mesh |
| Authentication    | JWT                 |
| Password Security | Password hashing    |
| API Testing       | Postman             |
| Server            | Uvicorn             |
| Version Control   | Git / GitHub        |

---

## 📁 Project Structure

```text
Automated-Attendance-System-using-Mediapipe-and-Mesh-Techniques/
│
├── backend/
│   ├── ...
│   └── ...
│
├── frontend/
│   ├── ...
│   └── ...
│
├── .gitignore
├── .gitattributes
├── package-lock.json
└── README.md
```

### Backend

The backend is responsible for:

* API endpoints
* Authentication
* Student management
* Face-recognition processing
* Attendance management
* Database communication
* Report-related operations

### Frontend

The frontend provides the user interface for:

* Authentication
* Student registration
* Live camera interaction
* Attendance monitoring
* Reports
* Dashboard statistics

---

# 🚀 Getting Started

## Prerequisites

Make sure you have the following installed:

* Python 3.9+
* Node.js and npm
* MongoDB / MongoDB Atlas
* Git
* A webcam

MediaPipe provides a Python package that can be installed through PyPI and supports Windows, macOS, and Linux.

---

## 1. Clone the Repository

```bash
git clone https://github.com/50001-SatyaKrishna/Automated-Attendance-System-using-Mediapipe-and-Mesh-Techniques.git

cd Automated-Attendance-System-using-Mediapipe-and-Mesh-Techniques
```

---

# ⚙️ Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
MONGO_URI=your_mongodb_connection_string

DATABASE_NAME=your_database_name

JWT_SECRET_KEY=your_secret_key
```

Do **not** commit your `.env` file to GitHub.

The repository's `.gitignore` should be configured to prevent secrets and environment-specific files from being committed.

---

## ▶️ Start the Backend

From the `backend` directory:

```bash
uvicorn main:app --reload
```

The API should then be available at:

```text
http://127.0.0.1:8000
```

FastAPI also provides interactive API documentation at:

```text
http://127.0.0.1:8000/docs
```

---

# 💻 Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the URL displayed by Vite.

---

# 🧪 API Testing

The backend APIs can be tested using **Postman**.

Typical API operations include:

```text
Authentication
    │
    ├── Login
    └── JWT authentication
         │
         ▼
Student Management
    │
    ├── Register student
    ├── Get students
    ├── Update student
    └── Delete student
         │
         ▼
Face Recognition
    │
    ├── Upload / process face
    ├── Generate facial representation
    └── Recognize face
         │
         ▼
Attendance
    │
    ├── Mark attendance
    ├── View attendance
    └── Generate reports
```

---

# 🧠 Computer Vision Pipeline

The core computer-vision component is based on **MediaPipe Face Mesh**.

MediaPipe Face Mesh estimates a dense set of facial landmarks in real time. The landmarks represent important regions of the face such as:

* Eyes
* Eyebrows
* Nose
* Mouth
* Face contour
* Other facial regions

The project uses this facial information as part of its recognition and liveness-processing pipeline.

```text
Camera Frame
     │
     ▼
Face Detection
     │
     ▼
Face Mesh / Landmarks
     │
     ▼
Feature Extraction
     │
     ▼
Face Recognition
     │
     ▼
Liveness Verification
     │
     ▼
Attendance Decision
```

---

# 🗄️ Database

MongoDB is used as the application's database.

The system stores information associated with:

### Student

```text
Name
Student ID
Email
Department
Photo
Facial representation
```

### Attendance

```text
Student
Date
Timestamp
Attendance status
```

The exact database schema may evolve as the project develops.

---

# 🔒 Security Considerations

The project includes several security-related mechanisms:

* Password hashing
* JWT-based authentication
* Protected API routes
* Environment variables for sensitive configuration
* Database-level access through the backend API

However, this project should be considered an **academic / portfolio project rather than a production-grade security system**.

Before deploying it for real institutional use, additional security work would be required, including:

* HTTPS
* Strong secret management
* Rate limiting
* Input validation
* Access-control hardening
* Audit logging
* Secure image/data storage
* Privacy and consent mechanisms
* Robust anti-spoofing evaluation

---

# ⚠️ Limitations

Facial-recognition systems are affected by real-world conditions.

Recognition performance may vary depending on:

* Lighting conditions
* Camera quality
* Face angle
* Occlusion
* Distance from camera
* Number of people in the frame
* Facial appearance changes
* Quality of registered face data

The liveness component also should not be interpreted as a complete defense against sophisticated presentation attacks.

---

# 🔮 Future Improvements

Possible future improvements include:

* [ ] More robust face-recognition models
* [ ] Improved anti-spoofing / liveness detection
* [ ] Multi-camera support
* [ ] Better recognition under varying lighting conditions
* [ ] Real-time attendance analytics
* [ ] CSV / Excel / PDF report generation
* [ ] Email notifications
* [ ] Role-based access control
* [ ] Docker-based deployment
* [ ] Cloud deployment
* [ ] Automated testing
* [ ] CI/CD pipeline
* [ ] Improved model evaluation and benchmarking
* [ ] Privacy-preserving biometric data storage

---

# 📊 Model Evaluation

For a production-oriented version of this system, recognition and liveness models should be evaluated using appropriate datasets and metrics.

Important metrics include:

### Face Recognition

* Accuracy
* Precision
* Recall
* F1-score
* False Acceptance Rate (FAR)
* False Rejection Rate (FRR)

### Liveness Detection

* Accuracy
* Precision
* Recall
* F1-score
* Attack Presentation Classification Error Rate (APCER)
* Bona Fide Presentation Classification Error Rate (BPCER)

A future version of the project could include a dedicated evaluation pipeline rather than relying only on visual testing.

---

# 🎯 Project Goals

The primary goals of this project are to:

1. Automate classroom attendance.
2. Reduce manual attendance-taking effort.
3. Explore real-time computer vision.
4. Apply facial recognition to a practical problem.
5. Integrate an AI/ML pipeline with a full-stack web application.
6. Provide a foundation for further research into biometric attendance systems.

---

# 📚 References

* [MediaPipe](https://github.com/google-ai-edge/mediapipe)
* [MediaPipe Face Mesh Documentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md)
* [FastAPI Documentation](https://fastapi.tiangolo.com/)
* [React Documentation](https://react.dev/)
* [MongoDB Documentation](https://www.mongodb.com/docs/)

---

# 👨‍💻 Author

**Satya Krishna**

B.Tech — Electronics and Computer Science

GitHub:
https://github.com/50001-SatyaKrishna

---

## ⭐ If you found this project useful

Consider giving the repository a ⭐ and exploring the source code.

---

## 📄 License

This project is intended primarily for educational and portfolio purposes.

Add an appropriate license file if you plan to distribute or reuse the project publicly.
