"""
FastAPI Backend for AI Data Visualizer
Handles data processing, LLM code generation, and visualization APIs
"""

import os
import io
import json
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime

# Load environment variables
try:
    from dotenv import load_dotenv
    # Load .env from the backend directory
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
except ImportError:
    pass

import pandas as pd

from data_processor import DataProcessor
from llm_generator import LLMGenerator
from visualization import VisualizationEngine
from bi_integration import BIIntegration

app = FastAPI(title="AI Data Visualizer API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store uploaded data in memory
data_store: Dict[str, Dict[str, Any]] = {}

import math
import numpy as np

def sanitize_value(value: Any) -> Any:
    if isinstance(value, float):
        if math.isnan(value) or math.isinf(value):
            return None
        return value

    if isinstance(value, (np.floating, np.integer)):
        val = value.item()
        if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            return None
        return val

    if isinstance(value, (np.ndarray,)):
        return value.tolist()

    return value


def sanitize(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize(v) for v in obj]
    return sanitize_value(obj)


# Read Groq API key from environment (do not expose this to frontend)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set. Please configure it in backend/.env or environment variables.")


class QueryRequest(BaseModel):
    session_id: str
    query: str


class GenerateVizRequest(BaseModel):
    session_id: str
    prefer_d3: bool = True


class InsightRequest(BaseModel):
    session_id: str


@app.get("/")
async def root():
    return {
        "message": "AI Data Visualizer API", 
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/upload",
            "data": "/api/data/{session_id}",
            "summary": "/api/summary/{session_id}",
            "insights": "/api/insights",
            "query": "/api/query",
            "visualization": "/api/generate-visualization",
            "sample_viz": "/api/sample-visualizations/{session_id}"
        }
    }


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)) -> JSONResponse:
    """
    Upload and process a data file
    """
    try:
        file_name = file.filename.lower()
        
        # Stream upload to a temporary file to support large files
        import tempfile, shutil

        file.file.seek(0)
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1]) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        try:
            df = DataProcessor.load_data(tmp_path, file_name)
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass

        if df is None:
            raise HTTPException(status_code=400, detail=f"Unsupported file format or failed to parse: {file.filename}")
        
        # Generate a session ID
        import uuid
        session_id = str(uuid.uuid4())
        
        # Extract attributes
        attributes = DataProcessor.extract_attributes(df)
        
        # Get data summary
        data_summary = DataProcessor.get_data_summary(df)
        
        # Store in memory
        data_store[session_id] = {
            "dataframe": df,
            "attributes": attributes,
            "summary": data_summary,
            "filename": file.filename,
            "created_at": datetime.now().isoformat(),
            "llm_dashboard_spec": None  # Will be generated on demand
        }
        
        return JSONResponse(sanitize({
            "session_id": session_id,
            "message": "File uploaded successfully",
            "filename": file.filename,
            "shape": list(df.shape),
            "columns": attributes["columns"],
            "numeric_columns": attributes["numeric_columns"],
            "categorical_columns": attributes["categorical_columns"],
            "sample_data": attributes["sample_data"]
        }))
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/data/{session_id}")
async def get_data(session_id: str) -> JSONResponse:
    """
    Get processed data and attributes for a session
    """
    if session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = data_store[session_id]
    df = data["dataframe"]
    
    return JSONResponse(sanitize({
        "session_id": session_id,
        "filename": data["filename"],
        "shape": list(df.shape),
        "columns": data["attributes"]["columns"],
        "numeric_columns": data["attributes"]["numeric_columns"],
        "categorical_columns": data["attributes"]["categorical_columns"],
        "datetime_columns": data["attributes"]["datetime_columns"],
        "sample_data": df.head(20).where(df.head(20).notna(), None).to_dict(orient='records'),
        "created_at": data["created_at"]
    }))


@app.get("/api/summary/{session_id}")
async def get_data_summary(session_id: str) -> JSONResponse:
    """
    Get comprehensive data summary
    """
    if session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = data_store[session_id]
    df = data["dataframe"]
    
    # Get detailed summary
    summary = DataProcessor.get_data_summary(df)
    
    return JSONResponse(sanitize({
        "session_id": session_id,
        "filename": data["filename"],
        "summary": summary
    }))


@app.post("/api/insights")
async def generate_insights(request: InsightRequest) -> JSONResponse:
    """
    Generate AI-powered data insights using LLM
    """
    if request.session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = data_store[request.session_id]
    df = data["dataframe"]
    
    try:
        llm = LLMGenerator(GROQ_API_KEY)
        insights = llm.generate_data_insights(df)
        
        return JSONResponse(sanitize({
            "summary": insights.get("summary", ""),
            "key_insights": insights.get("key_insights", [])
        }))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query")
async def query_data(request: QueryRequest) -> JSONResponse:
    """
    Query data using natural language (AQP)
    LLM converts human query to pandas code, executes it, and explains the result
    """
    if request.session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")

    df = data_store[request.session_id]["dataframe"]

    try:
        llm = LLMGenerator(GROQ_API_KEY)
        result = llm.query_data_with_llm(df, request.query)

        # Structure the response with better formatting
        structured_response = {
            "query": {
                "original": request.query,
                "interpretation": result.get("query_explanation", "Query processed successfully")
            },
            "code": {
                "pandas": result.get("pandas_code", ""),
                "status": "executed" if result.get("execution_result") is not None else "failed"
            },
            "results": {
                "data": result.get("execution_result", ""),
                "summary": result.get("result_explanation", ""),
                "type": "tabular" if isinstance(result.get("execution_result"), dict) and "columns" in result.get("execution_result", {}) else "text"
            },
            "metadata": {
                "timestamp": pd.Timestamp.now().isoformat(),
                "rows_affected": len(result.get("execution_result", {}).get("rows", [])) if isinstance(result.get("execution_result"), dict) else None
            },
            "error": result.get("error", None)
        }

        return JSONResponse(sanitize(structured_response))
    except Exception as e:
        return JSONResponse(sanitize({
            "query": {
                "original": request.query,
                "interpretation": "Failed to process query"
            },
            "code": {
                "pandas": "",
                "status": "error"
            },
            "results": {
                "data": "",
                "summary": "",
                "type": "error"
            },
            "metadata": {
                "timestamp": pd.Timestamp.now().isoformat(),
                "rows_affected": None
            },
            "error": str(e)
        }))


@app.post("/api/generate-visualization")
async def generate_visualization(request: GenerateVizRequest) -> JSONResponse:
    """
    Generate visualization code using LLM
    """
    if request.session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = data_store[request.session_id]
    attributes = data["attributes"]
    
    try:
        # Generate context for LLM
        context = DataProcessor.get_context_for_llm(attributes)
        
        # Generate code
        llm = LLMGenerator(GROQ_API_KEY)
        generated_code = llm.generate_visualization_code(context, request.prefer_d3)
        
        return JSONResponse({
            "generated_code": generated_code,
            "viz_type": "d3" if request.prefer_d3 else "plotly"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sample-visualizations/{session_id}")
async def get_sample_visualizations(session_id: str) -> JSONResponse:
    """
    Get sample visualizations without using LLM
    """
    if session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    df = data_store[session_id]["dataframe"]
    
    try:
        visualizations = VisualizationEngine.create_sample_visualizations(df)
        return JSONResponse(sanitize(visualizations))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/llm-dashboard/{session_id}")
async def get_llm_dashboard(session_id: str) -> JSONResponse:
    """
    Get LLM-driven dashboard specification with ZERO local heuristics.
    The LLM chooses all charts, KPIs, and filters based ONLY on dataset schema.
    """
    if session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    df = data_store[session_id]["dataframe"]
    
    try:
        llm = LLMGenerator(GROQ_API_KEY)
        
        # Generate dashboard spec using LLM (zero heuristics)
        dashboard_spec = llm.generate_dashboard_spec(df)
        
        if dashboard_spec is None:
            raise HTTPException(status_code=500, detail="Failed to generate dashboard specification")
        
        # Store the spec in the session for filter operations
        data_store[session_id]["llm_dashboard_spec"] = dashboard_spec
        
        # Execute the pandas snippets to get actual data
        executed_data = llm.execute_dashboard_spec(df, dashboard_spec)
        
        return JSONResponse(sanitize({
            "spec": dashboard_spec,
            "data": executed_data
        }))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class FilterRequest(BaseModel):
    session_id: str
    filter_id: str
    selected_values: List[str]


@app.post("/api/llm-dashboard/filter")
async def apply_llm_filter(request: FilterRequest) -> JSONResponse:
    """
    Apply a filter to the LLM dashboard and recompute affected visualizations.
    """
    if request.session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    data = data_store[request.session_id]
    df = data["dataframe"]
    dashboard_spec = data.get("llm_dashboard_spec")
    
    if dashboard_spec is None:
        raise HTTPException(status_code=400, detail="No LLM dashboard specification found. Generate one first.")
    
    try:
        llm = LLMGenerator(GROQ_API_KEY)
        
        # Find the filter in the spec
        filter_def = None
        for f in dashboard_spec.get("filters", []):
            if f.get("id") == request.filter_id:
                filter_def = f
                break
        
        if filter_def is None:
            raise HTTPException(status_code=404, detail="Filter not found")
        
        # Apply filter to dataframe
        column = filter_def.get("column")
        filtered_df = df if not request.selected_values else df[df[column].isin(request.selected_values)]
        
        # Recompute visualizations that use this filter
        results = {
            "filter_id": request.filter_id,
            "filtered_rows": len(filtered_df),
            "visualizations": []
        }
        
        for viz in dashboard_spec.get("visualizations", []):
            viz_id = viz.get("id")
            pandas_code = viz.get("pandas_code", "")
            
            # Replace df reference with filtered_df in the code
            if pandas_code:
                try:
                    local_ns = {'df': filtered_df, 'pd': pd, 'np': __import__('numpy'), 'result': None}
                    exec(pandas_code, local_ns)
                    data_result = local_ns.get('result')
                    
                    if isinstance(data_result, pd.DataFrame):
                        data_result = data_result.to_dict(orient='records')
                    elif hasattr(data_result, 'tolist'):
                        data_result = data_result.tolist()
                    
                    results["visualizations"].append({
                        "id": viz_id,
                        "data": data_result
                    })
                except Exception as e:
                    results["visualizations"].append({
                        "id": viz_id,
                        "error": str(e)
                    })
        
        # Also recompute metrics
        results["metrics"] = []
        for metric in dashboard_spec.get("metrics", []):
            metric_id = metric.get("id")
            pandas_code = metric.get("pandas_code", "")
            
            if pandas_code:
                try:
                    local_ns = {'df': filtered_df, 'pd': pd, 'np': __import__('numpy'), 'result': None}
                    exec(f"result = {pandas_code}", local_ns)
                    value = local_ns.get('result')
                    
                    if hasattr(value, 'item'):
                        value = value.item()
                    elif hasattr(value, 'tolist'):
                        value = value.tolist()
                    
                    results["metrics"].append({
                        "id": metric_id,
                        "value": value
                    })
                except Exception as e:
                    results["metrics"].append({
                        "id": metric_id,
                        "error": str(e)
                    })
        
        return JSONResponse(sanitize(results))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chart-data/{session_id}")
async def get_chart_data(
    session_id: str, 
    viz_type: str = "bar", 
    x_col: str = "", 
    y_col: str = ""
) -> JSONResponse:
    """
    Get formatted chart data for specific visualization
    """
    if session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    df = data_store[session_id]["dataframe"]
    
    try:
        chart_data = VisualizationEngine.get_chart_data(df, viz_type, x_col, y_col)
        return JSONResponse(sanitize({
            "data": chart_data,
            "viz_type": viz_type,
            "x_col": x_col,
            "y_col": y_col
        }))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CustomChartRequest(BaseModel):
    session_id: str
    chart_type: str  # bar, line, scatter, pie, histogram
    x_column: str
    y_column: str
    title: str = ""


@app.post("/api/custom-chart")
async def create_custom_chart(request: CustomChartRequest) -> JSONResponse:
    """
    Create a custom chart with user-selected columns
    """
    if request.session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    df = data_store[request.session_id]["dataframe"]
    
    try:
        # Validate columns exist
        if request.x_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{request.x_column}' not found")
        if request.y_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{request.y_column}' not found")
        
        # Generate chart based on type
        chart_config = VisualizationEngine.create_custom_chart(
            df, 
            request.chart_type, 
            request.x_column, 
            request.y_column,
            request.title or f"{request.y_column} by {request.x_column}"
        )
        
        return JSONResponse(sanitize(chart_config))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str) -> JSONResponse:
    """
    Delete a session and its data
    """
    if session_id in data_store:
        del data_store[session_id]
        return {"message": "Session deleted", "session_id": session_id}
    raise HTTPException(status_code=404, detail="Session not found")


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_sessions": len(data_store),
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ==================== BI Integration Endpoints ====================

bi_integration = BIIntegration()


@app.get("/api/bi/status")
async def get_bi_status():
    """
    Get status of BI integrations (Power BI and Tableau)
    """
    return JSONResponse(sanitize(bi_integration.get_status()))


class PowerBICredentials(BaseModel):
    session_id: str
    dataset_name: str = "DataSet"
    tenant_id: str
    client_id: str
    client_secret: str
    workspace_id: str


class TableauCredentials(BaseModel):
    session_id: str
    datasource_name: str = "DataSource"
    server_url: str
    token_name: str
    token_secret: str
    site_id: str


@app.post("/api/bi/powerbi/push")
async def push_to_powerbi(request: PowerBICredentials):
    """
    Push dataset to Power BI
    """
    if request.session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    df = data_store[request.session_id]["dataframe"]
    
    # Create PowerBI integration with provided credentials
    from bi_integration import PowerBIIntegration
    powerbi = PowerBIIntegration(
        tenant_id=request.tenant_id,
        client_id=request.client_id,
        client_secret=request.client_secret
    )
    powerbi.workspace_id = request.workspace_id
    
    try:
        result = powerbi.push_dataset(df, request.dataset_name)
        return JSONResponse(sanitize(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bi/tableau/publish")
async def publish_to_tableau(request: TableauCredentials):
    """
    Publish datasource to Tableau
    """
    if request.session_id not in data_store:
        raise HTTPException(status_code=404, detail="Session not found")
    
    df = data_store[request.session_id]["dataframe"]
    
    # Create Tableau integration with provided credentials
    from bi_integration import TableauIntegration
    tableau = TableauIntegration(
        server_url=request.server_url,
        token_name=request.token_name,
        token_secret=request.token_secret,
        site_id=request.site_id
    )
    
    try:
        result = tableau.publish_datasource(df, request.datasource_name)
        return JSONResponse(sanitize(result))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


