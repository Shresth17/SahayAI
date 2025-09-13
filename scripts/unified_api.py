from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pickle
import numpy as np
import uvicorn
from typing import Dict, Any, Optional
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("api_logs.log")
    ]
)

logger = logging.getLogger("sahay_api")

# Create FastAPI app
app = FastAPI(
    title="SahayAI API",
    description="API for grievance classification and spam detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware - more permissive configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Define models for request and response
class GrievanceRequest(BaseModel):
    description: str

class GrievanceClassificationResponse(BaseModel):
    grievance_category: str
    confidence_score: Optional[float] = None

class SpamDetectionResponse(BaseModel):
    is_spam: bool
    confidence_score: Optional[float] = None

class CombinedAnalysisResponse(BaseModel):
    grievance_category: str
    is_spam: bool
    category_confidence: Optional[float] = None
    spam_confidence: Optional[float] = None

# Initialize model variables
grievance_classifier = None
vectorizer = None
label_encoder = None
spam_detection_model = None

def load_models():
    """Load all required ML models"""
    global grievance_classifier, vectorizer, label_encoder, spam_detection_model
    
    try:
        # For grievance classification
        logger.info("Loading grievance classification models...")
        
        # Check if using XGBoost or another model format
        if os.path.exists("grievance_classifier.pkl"):
            grievance_classifier = joblib.load("grievance_classifier.pkl")
            logger.info("Loaded grievance_classifier.pkl")
        elif os.path.exists("grievance_classifier.json"):
            logger.info("Loading grievance_classifier.json with XGBoost")
            import xgboost as xgb
            grievance_classifier = xgb.Booster()
            grievance_classifier.load_model("grievance_classifier.json")
        else:
            logger.error("No grievance classifier model found!")
            raise FileNotFoundError("grievance_classifier.pkl or grievance_classifier.json not found")
        
        # Load vectorizer and label encoder
        if os.path.exists("vectorizer.pkl"):
            vectorizer = joblib.load("vectorizer.pkl")
            logger.info("Loaded vectorizer.pkl")
        else:
            logger.error("vectorizer.pkl not found!")
            raise FileNotFoundError("vectorizer.pkl not found")
            
        if os.path.exists("label_encoder.pkl"):
            label_encoder = joblib.load("label_encoder.pkl")
            logger.info("Loaded label_encoder.pkl")
        else:
            logger.error("label_encoder.pkl not found!")
            raise FileNotFoundError("label_encoder.pkl not found")
        
        # For spam detection
        logger.info("Loading spam detection model...")
        if os.path.exists("model.pkl"):
            with open("model.pkl", "rb") as model_file:
                spam_detection_model = pickle.load(model_file)
            logger.info("Loaded model.pkl for spam detection")
        else:
            logger.error("model.pkl not found!")
            raise FileNotFoundError("model.pkl not found")
            
        logger.info("All models loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        logger.error(f"Make sure all required model files are in the correct location")
        logger.error(f"Install all dependencies with: pip install -r requirements.txt")
        return False

@app.on_event("startup")
async def startup_event():
    """Runs when the API server starts up"""
    logger.info("Starting SahayAI API...")
    success = load_models()
    if not success:
        logger.warning("API started with model loading errors - some endpoints may not work correctly")

@app.get("/", tags=["Status"])
def home():
    """
    Root endpoint to check if the API is running.
    """
    return {
        "status": "online",
        "service": "SahayAI API",
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "endpoints": {
            "grievance_classification": "/classify",
            "spam_detection": "/spam-detect",
            "combined_analysis": "/analyze"
        }
    }
    
@app.get("/test", tags=["Test"])
def test_page():
    """
    Test endpoint that returns HTML.
    """
    html_content = """
    <!DOCTYPE html>
    <html>
        <head>
            <title>SahayAI API Test</title>
        </head>
        <body>
            <h1>SahayAI API is working!</h1>
            <p>This is a test page to verify that the server is responding correctly.</p>
            <p>Try accessing the API documentation at <a href="/docs">/docs</a> or <a href="/redoc">/redoc</a>.</p>
        </body>
    </html>
    """
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html_content)

@app.post("/classify", response_model=GrievanceClassificationResponse, tags=["Grievance"])
def classify_grievance(request: GrievanceRequest):
    """
    Classify a grievance into one of the predefined categories.
    
    - **description**: Text description of the grievance
    
    Returns the predicted category and confidence score.
    """
    try:
        # Check if models are loaded
        if grievance_classifier is None or vectorizer is None or label_encoder is None:
            logger.error("Classification models not loaded correctly")
            raise HTTPException(
                status_code=503, 
                detail="Grievance classification service unavailable - models not loaded. Check API logs."
            )
        
        # Validate input
        if not request.description or len(request.description.strip()) < 5:
            raise HTTPException(
                status_code=400, 
                detail="Invalid grievance description. Please provide a more detailed text."
            )
            
        logger.info(f"Received classification request: {request.description[:50]}...")
        
        # Preprocess & Vectorize
        description_cleaned = request.description.lower()
        description_vectorized = vectorizer.transform([description_cleaned])
        
        # Get prediction and confidence
        if hasattr(grievance_classifier, 'predict_proba'):
            probabilities = grievance_classifier.predict_proba(description_vectorized)
            prediction_idx = np.argmax(probabilities[0])
            confidence = float(probabilities[0][prediction_idx])
            category_prediction = label_encoder.inverse_transform([prediction_idx])[0]
        else:
            # For XGBoost or models without predict_proba
            description_vectorized_array = description_vectorized.toarray()
            numeric_prediction = grievance_classifier.predict(description_vectorized_array)[0]
            category_prediction = label_encoder.inverse_transform([numeric_prediction])[0]
            confidence = None  # XGBoost requires additional steps to get probabilities
            
        logger.info(f"Classification result: {category_prediction}")
        
        return {
            "grievance_category": category_prediction,
            "confidence_score": confidence
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail=f"Classification error: {str(e)}")

@app.post("/spam-detect", response_model=SpamDetectionResponse, tags=["Spam"])
def detect_spam(request: GrievanceRequest):
    """
    Detect whether a grievance text is spam or not.
    
    - **description**: Text description of the grievance
    
    Returns a boolean indicating if it's spam and the confidence score.
    """
    try:
        # Check if model is loaded
        if spam_detection_model is None:
            logger.error("Spam detection model not loaded correctly")
            raise HTTPException(
                status_code=503, 
                detail="Spam detection service unavailable - model not loaded. Check API logs."
            )
        
        # Validate input
        if not request.description or len(request.description.strip()) < 5:
            raise HTTPException(
                status_code=400, 
                detail="Invalid text for spam detection. Please provide a more detailed text."
            )
            
        logger.info(f"Received spam detection request: {request.description[:50]}...")
        
        # Make prediction
        if hasattr(spam_detection_model, 'predict_proba'):
            probabilities = spam_detection_model.predict_proba([request.description])[0]
            is_spam = bool(np.argmax(probabilities))
            confidence = float(probabilities[np.argmax(probabilities)])
        else:
            is_spam = bool(spam_detection_model.predict([request.description])[0])
            confidence = None
            
        logger.info(f"Spam detection result: {is_spam}")
        
        return {
            "is_spam": is_spam,
            "confidence_score": confidence
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Spam detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Spam detection error: {str(e)}")

@app.post("/analyze", response_model=CombinedAnalysisResponse, tags=["Combined"])
def analyze_grievance(request: GrievanceRequest):
    """
    Perform both classification and spam detection on a grievance.
    
    - **description**: Text description of the grievance
    
    Returns both the classification and spam detection results.
    """
    try:
        logger.info(f"Received combined analysis request: {request.description[:50]}...")
        
        # Check if all required models are loaded
        models_missing = []
        if grievance_classifier is None or vectorizer is None or label_encoder is None:
            models_missing.append("grievance classification")
        if spam_detection_model is None:
            models_missing.append("spam detection")
            
        if models_missing:
            raise HTTPException(
                status_code=503,
                detail=f"The following services are unavailable: {', '.join(models_missing)}"
            )
        
        # Validate input
        if not request.description or len(request.description.strip()) < 5:
            raise HTTPException(
                status_code=400, 
                detail="Invalid grievance description. Please provide a more detailed text."
            )
        
        # Get classification results
        classification_result = classify_grievance(request)
        
        # Get spam detection results
        spam_result = detect_spam(request)
        
        return {
            "grievance_category": classification_result["grievance_category"],
            "is_spam": spam_result["is_spam"],
            "category_confidence": classification_result["confidence_score"],
            "spam_confidence": spam_result["confidence_score"]
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Combined analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Combined analysis error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)