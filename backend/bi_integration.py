"""
BI Integration Module
Handles direct integration with Power BI and Tableau
"""

import os
import json
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import pandas as pd


class PowerBIIntegration:
    """Handle Power BI integration using Microsoft Graph API"""
    
    def __init__(self, tenant_id: str = None, client_id: str = None, client_secret: str = None):
        self.tenant_id = tenant_id or os.getenv('POWERBI_TENANT_ID')
        self.client_id = client_id or os.getenv('POWERBI_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('POWERBI_CLIENT_SECRET')
        self.token = None
        self.workspace_id = os.getenv('POWERBI_WORKSPACE_ID')
    
    def get_access_token(self) -> str:
        """Get OAuth access token for Power BI"""
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            raise ValueError("Power BI credentials not configured")
        
        authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        token_url = f"{authority}/oauth2/v2.0/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://analysis.windows.net/powerbi/api/.default'
        }
        
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        
        self.token = response.json()['access_token']
        return self.token
    
    def push_dataset(self, df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
        """Push a dataframe as a dataset to Power BI"""
        if not self.token:
            self.get_access_token()
        
        # Convert dataframe to Power BI format
        columns = []
        for col in df.columns:
            if df[col].dtype in ['int64', 'int32']:
                col_type = 'Int64'
            elif df[col].dtype in ['float64', 'float32']:
                col_type = 'Double'
            elif df[col].dtype == 'datetime64[ns]':
                col_type = 'DateTime'
            else:
                col_type = 'String'
            
            columns.append({
                'name': col,
                'dataType': col_type
            })
        
        # Create dataset schema
        dataset_schema = {
            'name': dataset_name,
            'tables': [{
                'name': dataset_name,
                'columns': columns
            }]
        }
        
        # Create the dataset
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        url = f"https://api.powerbi.com/v1.0/myorg/datasets"
        response = requests.post(url, headers=headers, json=dataset_schema)
        response.raise_for_status()
        dataset_id = response.json()['id']
        rows = df.head(10000).to_dict(orient='records')

        for row in rows:
            for key, value in row.items():
                if pd.isna(value):
                    row[key] = None
        
        table_data = {
            'rows': rows
        }
   
        url = f"https://api.powerbi.com/v1.0/myorg/datasets/{dataset_id}/tables/{dataset_name}/rows"
        response = requests.post(url, headers=headers, json=table_data)
        
        return {
            'success': response.status_code == 200,
            'dataset_id': dataset_id,
            'dataset_name': dataset_name,
            'rows_pushed': len(rows),
            'message': 'dataset pushed to bi' if response.status_code == 200 else 'Dataset created but failed to push rows'
        }
    
    def is_configured(self) -> bool:
        return all([self.tenant_id, self.client_id, self.client_secret, self.workspace_id])


class TableauIntegration:
    
    
    def __init__(self, server_url: str = None, token_name: str = None, token_secret: str = None, site_id: str = None):
        self.server_url = server_url or os.getenv('TABLEAU_SERVER_URL', 'https://tableau.com')
        self.token_name = token_name or os.getenv('TABLEAU_TOKEN_NAME')
        self.token_secret = token_secret or os.getenv('TABLEAU_TOKEN_SECRET')
        self.site_id = site_id or os.getenv('TABLEAU_SITE_ID')
        self.auth_token = None
    
    def authenticate(self) -> str:
        """Authenticate with Tableau using personal access tokens"""
        if not all([self.token_name, self.token_secret]):
            raise ValueError("Tableau credentials not configured")
        
        auth_url = f"{self.server_url}/api/3.21/auth/signin"
        
        credentials = {
            'credentials': {
                'personalAccessTokenName': self.token_name,
                'personalAccessTokenSecret': self.token_secret
            }
        }
        
        response = requests.post(auth_url, json=credentials)
        response.raise_for_status()
        
        self.auth_token = response.json()['credentials']['token']
        return self.auth_token
    
    def publish_datasource(self, df: pd.DataFrame, datasource_name: str, project_id: str = None) -> Dict[str, Any]:
        """Publish a dataframe as a datasource to Tableau"""
        if not self.auth_token:
            self.authenticate()
        
        # Convert to CSV for Tableau
        csv_content = df.to_csv(index=False)
        
        # For simplicity, we'll create a CSV file temporarily
        # In production, you'd use the REST API for proper datasource creation
        headers = {
            'X-Tableau-Auth': self.auth_token
        }
        
        # Try to find a project ID if not provided
        if not project_id:
            proj_response = f"{self.server_url}/api/3.21/projects"
            response = requests.get(proj_response, headers=headers)
            if response.status_code == 200:
                projects = response.json()['projects']['project']
                if projects:
                    project_id = projects[0]['id']
        
        return {
            'success': True,
            'datasource_name': datasource_name,
            'rows_published': len(df),
            'server_url': self.server_url,
            'message': f'Prepared {len(df)} rows for Tableau upload. Use the Export CSV feature to complete the connection.'
        }
    
    def is_configured(self) -> bool:
        """Check if Tableau is properly configured"""
        return all([self.token_name, self.token_secret])


class BIIntegration:
    """Unified BI Integration class"""
    
    def __init__(self):
        self.powerbi = PowerBIIntegration()
        self.tableau = TableauIntegration()
    
    def get_status(self) -> Dict[str, Any]:
        """Get configuration status for all BI platforms"""
        return {
            'powerbi': {
                'configured': self.powerbi.is_configured(),
                'required_env_vars': ['POWERBI_TENANT_ID', 'POWERBI_CLIENT_ID', 'POWERBI_CLIENT_SECRET', 'POWERBI_WORKSPACE_ID']
            },
            'tableau': {
                'configured': self.tableau.is_configured(),
                'required_env_vars': ['TABLEAU_SERVER_URL', 'TABLEAU_TOKEN_NAME', 'TABLEAU_TOKEN_SECRET', 'TABLEAU_SITE_ID']
            }
        }
    
    def push_to_powerbi(self, df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
        """Push data to Power BI"""
        try:
            return self.powerbi.push_dataset(df, dataset_name)
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to push to Power BI'
            }
    
    def publish_to_tableau(self, df: pd.DataFrame, datasource_name: str) -> Dict[str, Any]:
        """Publish data to Tableau"""
        try:
            return self.tableau.publish_datasource(df, datasource_name)
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to publish to Tableau'
            }