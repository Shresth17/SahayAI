# SahayAI API Documentation

This document provides comprehensive guidance on installing, configuring, and using the SahayAI API for grievance classification and spam detection.

## Overview

The SahayAI API provides machine learning-powered endpoints that allow you to:

1. **Classify grievances** into predefined categories
2. **Detect spam grievances** to filter out illegitimate submissions
3. **Perform combined analysis** with both classification and spam detection in one request

## Installation Requirements

### Prerequisites

- Python 3.8 or higher
- Required model files in the `scripts` directory:
  - `grievance_classifier.pkl` or `grievance_classifier.json` (for grievance classification)
  - `vectorizer.pkl` (for text preprocessing)
  - `label_encoder.pkl` (for decoding class labels)
  - `model.pkl` (for spam detection)
- Microsoft Visual C++ Build Tools (for Windows) - [Download Link](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Installation Steps

1. **Install dependencies**

```bash
cd scripts
pip install -r requirements.txt
```

2. **Verify model files are present**

Ensure all the required model files mentioned above are in the `scripts` directory.

## Running the API

Start the FastAPI server:

```bash
cd scripts
python -m uvicorn unified_api:app --reload --host 127.0.0.1 --port 8000
```

For production deployment:

```bash
python -m uvicorn unified_api:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Root Endpoint (`GET /`)

Returns basic information about the API status and available endpoints.

**Example Response:**
```json
{
  "status": "online",
  "service": "SahayAI API",
  "time": "2025-09-13 12:30:45",
  "endpoints": {
    "grievance_classification": "/classify",
    "spam_detection": "/spam-detect",
    "combined_analysis": "/analyze"
  }
}
```

### Grievance Classification (`POST /classify`)

Classifies a grievance into a predefined category.

**Request Body:**
```json
{
  "description": "My grievance description text here"
}
```

**Response:**
```json
{
  "grievance_category": "CategoryName",
  "confidence_score": 0.95
}
```

### Spam Detection (`POST /spam-detect`)

Detects whether a grievance is spam or legitimate.

**Request Body:**
```json
{
  "description": "My grievance description text here"
}
```

**Response:**
```json
{
  "is_spam": false,
  "confidence_score": 0.87
}
```

### Combined Analysis (`POST /analyze`)

Performs both classification and spam detection on a grievance.

**Request Body:**
```json
{
  "description": "My grievance description text here"
}
```

**Response:**
```json
{
  "grievance_category": "CategoryName",
  "is_spam": false,
  "category_confidence": 0.95,
  "spam_confidence": 0.87
}
```

## Interactive Documentation

FastAPI automatically generates interactive API documentation:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

These interfaces allow you to explore and test all API endpoints directly in your browser.

## Frontend Integration

### JavaScript Example

```javascript
// Example using fetch API
async function analyzeGrievance(grievanceText) {
  try {
    const response = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: grievanceText }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing grievance:', error);
    throw error;
  }
}
```

### React Component Example

```jsx
import { useState } from 'react';

function GrievanceAnalyzer() {
  const [grievanceText, setGrievanceText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: grievanceText }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Grievance Analyzer</h2>
      <textarea
        value={grievanceText}
        onChange={(e) => setGrievanceText(e.target.value)}
        placeholder="Enter grievance text here..."
        rows={5}
        cols={50}
      />
      <button onClick={handleAnalyze} disabled={loading || !grievanceText.trim()}>
        {loading ? 'Analyzing...' : 'Analyze Grievance'}
      </button>
      
      {error && <div className="error">Error: {error}</div>}
      
      {result && (
        <div className="result">
          <h3>Analysis Results:</h3>
          <p><strong>Category:</strong> {result.grievance_category}</p>
          <p><strong>Is Spam:</strong> {result.is_spam ? 'Yes' : 'No'}</p>
          {result.category_confidence && (
            <p><strong>Category Confidence:</strong> {(result.category_confidence * 100).toFixed(1)}%</p>
          )}
          {result.spam_confidence && (
            <p><strong>Spam Detection Confidence:</strong> {(result.spam_confidence * 100).toFixed(1)}%</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Model Loading Errors**
   - Ensure all model files are in the correct location
   - Check API logs (`api_logs.log`) for detailed error messages
   - Verify models are compatible with the installed scikit-learn version

2. **Dependency Installation Issues**
   - On Windows, install Microsoft C++ Build Tools
   - Try using a Python virtual environment: `python -m venv venv`
   - Update pip: `pip install --upgrade pip`

3. **API Connection Issues**
   - Verify the server is running
   - Check CORS settings if calling from a different origin
   - Try a different port if 8000 is already in use: `--port 8001`

### API Error Responses

The API returns detailed error messages when something goes wrong:

- `400 Bad Request`: Invalid input (e.g., empty description)
- `500 Internal Server Error`: Server-side error during processing
- `503 Service Unavailable`: Models not loaded correctly

### Checking Logs

API logs are stored in `api_logs.log` in the scripts directory. Check this file for detailed error messages and debugging information.

## Production Deployment

For production use, consider:

1. **Using a WSGI server** like Gunicorn with Uvicorn workers:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker unified_api:app
   ```

2. **Setting up a reverse proxy** with Nginx or Apache

3. **Securing the API** with proper authentication (JWT, API keys, etc.)

4. **Implementing rate limiting** to prevent abuse

5. **Containerizing the application** with Docker for easier deployment

## Security Considerations

- The API currently allows CORS from all origins (`"*"`) for testing. Restrict this to specific origins in production.
- Add proper authentication mechanisms before exposing the API publicly.
- Consider input validation and sanitization to prevent potential injection attacks.