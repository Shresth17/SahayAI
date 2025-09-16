from fastapi import FastAPI, UploadFile, File, HTTPException
import pickle
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
from typing import Optional
import PyPDF2
import io
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Load the trained spam detection model
with open("model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

# Configure Google Gemini API
# API key is loaded from .env file - make sure to set GEMINI_API_KEY in .env
# Get a free API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_api_key_here")
if GEMINI_API_KEY != "your_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️  WARNING: GEMINI_API_KEY not found in environment variables!")
    print("   Please set GEMINI_API_KEY in the .env file")

# Global variable to store PDF content with session management
pdf_sessions = {}

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://sahay-ai-dbh3.vercel.app","https://sahay-ai.vercel.app"],  # Adjust for your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GrievanceRequest(BaseModel):
    description: str

class QuestionRequest(BaseModel):
    query: str
    session_id: str

@app.post("/predict")
async def predict(request: GrievanceRequest):
    description = request.description

    # Predict whether the grievance is spam (assuming model expects a list of text inputs)
    prediction = model.predict([description])[0]  # 1 means spam, 0 means not spam

    return {"spam": bool(prediction)}

@app.post("/init_rag")
async def init_rag(pdf_files: UploadFile = File(...)):
    """Initialize RAG system with uploaded PDF"""
    global pdf_sessions
    
    if not pdf_files.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read PDF content
        pdf_bytes = await pdf_files.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        
        # Extract text from all pages
        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"
        
        # Generate a session ID for this PDF
        session_id = str(uuid.uuid4())
        
        # Store PDF content with session ID
        pdf_sessions[session_id] = text_content
        
        return {
            "message": "PDF processed successfully", 
            "pages": len(pdf_reader.pages),
            "session_id": session_id
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/ask_question")
async def ask_question(request: QuestionRequest):
    """Ask a question about the uploaded PDF"""
    global pdf_sessions
    
    # Check if session exists
    if request.session_id not in pdf_sessions:
        raise HTTPException(status_code=400, detail="Invalid session ID. Please upload a PDF first.")
    
    pdf_content = pdf_sessions[request.session_id]
    
    if not pdf_content:
        raise HTTPException(status_code=400, detail="No PDF content found for this session.")
    
    if GEMINI_API_KEY == "your_api_key_here":
        raise HTTPException(status_code=503, detail="Gemini API key not configured. Please set GEMINI_API_KEY environment variable.")
    
    try:
        # Initialize Gemini model
        model_ai = genai.GenerativeModel('gemini-1.5-flash')
        
        # Create prompt with PDF content and user question
        prompt = f"""
        Based on the following PDF content, please answer the question accurately and concisely.
        
        PDF Content:
        {pdf_content[:10000]}  # Limit to first 10k characters to avoid token limits
        
        Question: {request.query}
        
        Please provide a clear and helpful answer based only on the information in the PDF.
        """
        
        # Generate response
        response = model_ai.generate_content(prompt)
        
        return {"answer": response.text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
