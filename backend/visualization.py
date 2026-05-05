"""
Visualization Module
Handles visualization configuration generation with intelligent data parsing
"""

import pandas as pd
import json
from typing import Dict, Any, List, Optional
import plotly.graph_objects as go
import plotly.express as px

# Professional BI Color Palette
BI_COLORS = {
    'cyan': "#74CFDF",
    'emerald': '#10B981',
    'purple': '#A855F7',
    'orange': '#F97316',
    'sky': '#0EA5E9',
    'teal': '#14B8A6',
    'pink': '#EC4899',
    'blue': '#3B82F6',
    'amber': '#F59E0B',
    'red': '#EF4444'
}

COLORS = [
    BI_COLORS['cyan'],
    BI_COLORS['emerald'],
    BI_COLORS['purple'],
    BI_COLORS['orange'],
    BI_COLORS['sky'],
    BI_COLORS['teal'],
    BI_COLORS['pink'],
    BI_COLORS['blue'],
    BI_COLORS['amber'],
    BI_COLORS['red']
]


class VisualizationEngine:
    """Handles creation of visualization configurations"""
    
    def __init__(self, df: pd.DataFrame):
        """
        Initialize visualization engine
        
        Args:
            df: The dataset to visualize
        """
        self.df = df
    
    @staticmethod
    def _is_likely_id_column(col: str, df: pd.DataFrame) -> bool:
        """
        Check if a column is likely an ID or irrelevant identifier
        """
        col_lower = col.lower()
        
        # Check for common ID patterns
        id_patterns = ['id', 'code', 'number', 'no.', 'serial', 'key', 'uuid', 'index']
        if any(pattern in col_lower for pattern in id_patterns):
            return True
        
        # Check if column has high cardinality (almost unique values) - likely IDs
        if df[col].dtype in ['object', 'int64', 'int32']:
            unique_ratio = df[col].nunique() / len(df)
            if unique_ratio > 0.9:  # More than 90% unique - likely ID
                return True
        
        return False

    @staticmethod
    def _find_correlated_pairs(df: pd.DataFrame, numeric_cols: List[str]) -> List[tuple]:
        """
        Find pairs of numeric columns sorted by correlation strength
        """
        if len(numeric_cols) < 2:
            return []
        
        try:
            corr_matrix = df[numeric_cols].corr()
            pairs = []
            
            for i in range(len(numeric_cols)):
                for j in range(i + 1, len(numeric_cols)):
                    corr_value = abs(corr_matrix.iloc[i, j])
                    if not pd.isna(corr_value):
                        pairs.append((numeric_cols[i], numeric_cols[j], corr_value))
            
            # Sort by correlation strength (descending)
            pairs.sort(key=lambda x: x[2], reverse=True)
            return pairs
        except:
            return []

    @staticmethod
    def _get_meaningful_columns(df: pd.DataFrame) -> Dict[str, List[str]]:
        """
        Filter out ID-like columns and return meaningful columns for visualization
        """
        all_cols = df.columns.tolist()
        
        # Filter out ID-like columns
        meaningful_numeric = []
        meaningful_categorical = []
        
        for col in all_cols:
            if df[col].dtype in ['int64', 'int32', 'float64', 'float32']:
                if not VisualizationEngine._is_likely_id_column(col, df):
                    meaningful_numeric.append(col)
            elif df[col].dtype == 'object' or df[col].dtype.name == 'category':
                # For categorical, check cardinality - too many unique values is not useful
                unique_count = df[col].nunique()
                if unique_count > 1 and unique_count < len(df) * 0.5:  # Reasonable number of categories
                    meaningful_categorical.append(col)
        
        return {
            'numeric': meaningful_numeric,
            'categorical': meaningful_categorical
        }

    @staticmethod
    def create_sample_visualizations(df: pd.DataFrame) -> Dict[str, Any]:
        import plotly.graph_objects as go
        import plotly.express as px
        
        # Get meaningful columns (filter out IDs)
        meaningful_cols = VisualizationEngine._get_meaningful_columns(df)
        numeric_cols = meaningful_cols['numeric']
        cat_cols = meaningful_cols['categorical']
        
        # Get datetime columns for time series
        datetime_cols = df.select_dtypes(include=['datetime64']).columns.tolist()
        
        # Find correlated numeric column pairs
        correlated_pairs = VisualizationEngine._find_correlated_pairs(df, numeric_cols)
        
        visualizations = []
        metrics = []
        
        # Calculate comprehensive metrics from numeric columns
        if numeric_cols:
            for i, col in enumerate(numeric_cols[:6]):
                total_val = df[col].sum()
                mean_val = df[col].mean()
                max_val = df[col].max()
                min_val = df[col].min()
                std_val = df[col].std()
                
                # Determine metric format based on column characteristics
                is_percentage = ('percent' in col.lower() or 'rate' in col.lower() or '%' in col)
                is_currency = ('price' in col.lower() or 'cost' in col.lower() or 'revenue' in col.lower() or 'amount' in col.lower() or '$' in col)
                
                metric_format = "percent" if is_percentage else "currency" if is_currency else "number"
                
                # Add comprehensive metrics for first numeric column
                if i == 0:
                    metrics.extend([
                        {
                            "label": f"Total {col.title()}", 
                            "value": float(total_val) if pd.notnull(total_val) else 0, 
                            "format": metric_format,
                            "color": "#06B6D4"
                        },
                        {
                            "label": f"Average {col.title()}", 
                            "value": float(mean_val) if pd.notnull(mean_val) else 0, 
                            "format": metric_format,
                            "color": "#10B981"
                        },
                        {
                            "label": f"Max {col.title()}", 
                            "value": float(max_val) if pd.notnull(max_val) else 0, 
                            "format": metric_format,
                            "color": "#F59E0B"
                        },
                    ])
                else:
                    # Include average for other columns
                    metrics.append({
                        "label": f"Avg {col.title()}", 
                        "value": float(mean_val) if pd.notnull(mean_val) else 0, 
                        "format": metric_format,
                        "color": COLORS[i % len(COLORS)]
                    })
        
        # Add record count metric
        metrics.append({
            "label": "Total Records",
            "value": len(df),
            "format": "number",
            "color": BI_COLORS['blue']
        })
        
        # Limit to top 6 metrics
        metrics = metrics[:6]
        
        if cat_cols:
            for idx, col in enumerate(cat_cols[:2]):
                unique_count = df[col].nunique()
                metrics.append({
                    "label": f"Unique {col.title()}",
                    "value": int(unique_count) if pd.notnull(unique_count) else 0,
                    "format": "number",
                    "color": COLORS[(idx + 4) % len(COLORS)]
                })
        
        # ===== CREATE PLOTLY VISUALIZATIONS =====
        
        # 1. Bar Chart - Use most correlated categorical-numeric pair or best available
        if cat_cols and numeric_cols:
            # Find categorical column with best aggregation potential
            best_cat = None
            best_num = None
            
            for cat in cat_cols:
                for num in numeric_cols:
                    # Check if this pair has good variation (not all same values)
                    grouped = df.groupby(cat)[num].sum()
                    if len(grouped) > 1 and grouped.std() > 0:
                        best_cat = cat
                        best_num = num
                        break
                if best_cat:
                    break
            
            if not best_cat:
                best_cat = cat_cols[0]
                best_num = numeric_cols[0]
            
            agg_df = df.groupby(best_cat)[best_num].sum().reset_index().sort_values(best_num, ascending=False).head(10)
            fig_bar = go.Figure()
            fig_bar.add_trace(go.Bar(
                x=agg_df[best_cat].astype(str),
                y=agg_df[best_num],
                marker=dict(color=COLORS, colorscale='Blues'),
                name=best_num
            ))
            fig_bar.update_layout(
                title=f'{best_num.title()} by {best_cat.title()}',
                xaxis_title=best_cat.title(),
                yaxis_title=best_num.title(),
                hovermode='x unified',
                template='plotly_dark'
            )
            visualizations.append({
                "type": "bar",
                "title": f"{best_num.title()} by {best_cat.title()}",
                "data": json.loads(fig_bar.to_json())
            })
        
        # 2. Line Chart - Use most correlated numeric columns for comparison
        if numeric_cols:
            # Use top 2-3 correlated columns for trend analysis
            sample_df = df.head(30).reset_index(drop=True)
            fig_line = go.Figure()
            
            # Get columns with highest variance (most interesting to plot)
            col_variance = [(col, df[col].var()) for col in numeric_cols if df[col].var() > 0]
            col_variance.sort(key=lambda x: x[1], reverse=True)
            
            for idx, col in enumerate([c[0] for c in col_variance[:3]]):
                fig_line.add_trace(go.Scatter(
                    y=sample_df[col],
                    mode='lines',
                    name=col,
                    line=dict(width=2.5, color=COLORS[idx % len(COLORS)])
                ))
            
            fig_line.update_layout(
                title=f'Trend Analysis - Top Metrics',
                xaxis_title='Records',
                yaxis_title='Value',
                hovermode='x unified',
                template='plotly_dark'
            )
            visualizations.append({
                "type": "line",
                "title": "Trend Analysis",
                "data": json.loads(fig_line.to_json())
            })
        
        # 3. Scatter Plot - Use most correlated numeric pair
        if len(correlated_pairs) > 0:
            # Use the pair with highest correlation
            col1, col2, corr = correlated_pairs[0]
            fig_scatter = go.Figure()
            sample_df = df.head(100).dropna(subset=[col1, col2])
            
            fig_scatter.add_trace(go.Scatter(
                x=sample_df[col1],
                y=sample_df[col2],
                mode='markers',
                marker=dict(size=8, color=BI_COLORS['pink'], opacity=0.7, line=dict(width=1, color=BI_COLORS['sky'])),
                name='Data'
            ))
            
            fig_scatter.update_layout(
                title=f'{col1.title()} vs {col2.title()} (r={corr:.2f})',
                xaxis_title=col1.title(),
                yaxis_title=col2.title(),
                hovermode='closest',
                template='plotly_dark'
            )
            visualizations.append({
                "type": "scatter",
                "title": f"Correlation: {col1.title()} vs {col2.title()}",
                "data": json.loads(fig_scatter.to_json())
            })
        
        # 4. Histogram - Use column with highest variance (most interesting distribution)
        if numeric_cols:
            # Sort by variance to find most interesting column
            col_variance = [(col, df[col].var()) for col in numeric_cols if df[col].var() > 0]
            col_variance.sort(key=lambda x: x[1], reverse=True)
            hist_col = col_variance[0][0] if col_variance else numeric_cols[0]
            
            fig_hist = go.Figure()
            fig_hist.add_trace(go.Histogram(
                x=df[hist_col].dropna(),
                nbinsx=20,
                marker=dict(color=BI_COLORS['amber']),
                name=hist_col
            ))
            
            fig_hist.update_layout(
                title=f'Distribution - {hist_col.title()}',
                xaxis_title=hist_col.title(),
                yaxis_title='Frequency',
                hovermode='x unified',
                template='plotly_dark'
            )
            visualizations.append({
                "type": "histogram",
                "title": f"Distribution - {hist_col.title()}",
                "data": json.loads(fig_hist.to_json())
            })
        
        # 5. Box Plot
        if numeric_cols and cat_cols:
            fig_box = go.Figure()
            
            for idx, cat in enumerate(df[cat_cols[0]].unique()[:10]):
                cat_data = df[df[cat_cols[0]] == cat][numeric_cols[0]].dropna()
                fig_box.add_trace(go.Box(
                    y=cat_data,
                    name=str(cat)[:15],
                    marker=dict(color=COLORS[idx % len(COLORS)])
                ))
            
            fig_box.update_layout(
                title=f'{numeric_cols[0].title()} Distribution by {cat_cols[0].title()}',
                yaxis_title=numeric_cols[0].title(),
                template='plotly_dark',
                hovermode='y unified'
            )
            visualizations.append({
                "type": "box",
                "title": f"Box Plot - {numeric_cols[0].title()}",
                "data": json.loads(fig_box.to_json())
            })
        
        # 6. Heatmap - Correlation matrix
        if len(numeric_cols) >= 2:
            corr_df = df[numeric_cols[:8]].corr()
            fig_heatmap = go.Figure(data=go.Heatmap(
                z=corr_df.values,
                x=corr_df.columns,
                y=corr_df.columns,
                colorscale='Teal',
                hovertemplate='%{y} vs %{x}: %{z:.2f}<extra></extra>'
            ))
            
            fig_heatmap.update_layout(
                title='Correlation Heatmap',
                template='plotly_dark'
            )
            visualizations.append({
                "type": "heatmap",
                "title": "Correlation Heatmap",
                "data": json.loads(fig_heatmap.to_json())
            })
        
        return {
            "title": "Data Dashboard",
            "metrics": metrics,
            "visualizations": visualizations,
            "spec": {
                "filters": []
            },
            "data": {
                "visualizations": visualizations,
                "metrics": metrics
            },
            "columns": {
                "numeric": numeric_cols,
                "categorical": cat_cols
            }
        }
    
    @staticmethod
    def get_chart_data(df: pd.DataFrame, viz_type: str, x_col: str, y_col: str) -> List[Dict]:
        """
        Get data formatted for charts
        
        Args:
            df: The dataset
            viz_type: Type of visualization
            x_col: X-axis column
            y_col: Y-axis column(s)
            
        Returns:
            List of data points for the chart
        """
        if viz_type == "bar":
            agg_data = df.groupby(x_col)[y_col].sum().dropna().reset_index()
            return agg_data.to_dict(orient='records')
        elif viz_type == "line":
            if isinstance(y_col, list):
                result = df[[x_col] + y_col].dropna().to_dict(orient='records')
                return result
            return df.dropna().to_dict(orient='records')
        elif viz_type == "pie":
            top_n = df.groupby(x_col)[y_col].sum().nlargest(10).reset_index()
            return top_n.to_dict(orient='records')
        else:
            return df.to_dict(orient='records')

    @staticmethod
    def create_custom_chart(df: pd.DataFrame, chart_type: str, x_col: str, y_col: str, title: str = "") -> Dict[str, Any]:
        """
        Create a custom chart with user-selected columns
        
        Args:
            df: The dataset
            chart_type: Type of chart (bar, line, scatter, pie, histogram)
            x_col: X-axis column
            y_col: Y-axis column
            title: Chart title
            
        Returns:
            Chart configuration for frontend
        """
        import plotly.graph_objects as go
        
        fig = go.Figure()
        chart_type = chart_type.lower()
        
        if chart_type == "bar":
            # Aggregate data by x column
            agg_df = df.groupby(x_col)[y_col].sum().reset_index().sort_values(y_col, ascending=False).head(15)
            fig.add_trace(go.Bar(
                x=agg_df[x_col].astype(str),
                y=agg_df[y_col],
                marker=dict(color=COLORS[0], opacity=0.8),
                name=y_col
            ))
            
        elif chart_type == "line":
            # For numeric x, use directly; for categorical, use index
            if df[x_col].dtype in ['int64', 'float64', 'int32', 'float32']:
                fig.add_trace(go.Scatter(
                    x=df[x_col],
                    y=df[y_col],
                    mode='lines+markers',
                    line=dict(color=COLORS[1], width=2),
                    name=y_col
                ))
            else:
                sample_df = df.head(50)
                fig.add_trace(go.Scatter(
                    y=sample_df[y_col],
                    mode='lines+markers',
                    line=dict(color=COLORS[1], width=2),
                    name=y_col
                ))
                fig.update_layout(xaxis_title='Index')
        
        elif chart_type == "scatter":
            sample_df = df.head(100).dropna(subset=[x_col, y_col])
            fig.add_trace(go.Scatter(
                x=sample_df[x_col],
                y=sample_df[y_col],
                mode='markers',
                marker=dict(size=10, color=BI_COLORS['pink'], opacity=0.7),
                name='Data'
            ))
        
        elif chart_type == "pie":
            # Aggregate and get top categories
            agg_df = df.groupby(x_col)[y_col].sum().nlargest(8).reset_index()
            fig.add_trace(go.Pie(
                labels=agg_df[x_col].astype(str),
                values=agg_df[y_col],
                hole=0.4,
                marker=dict(colors=COLORS)
            ))
        
        elif chart_type == "histogram":
            fig.add_trace(go.Histogram(
                x=df[y_col].dropna(),
                nbinsx=20,
                marker=dict(color=BI_COLORS['amber']),
                name=y_col
            ))
            fig.update_layout(xaxis_title=y_col, yaxis_title='Frequency')
        
        else:
            # Default to bar
            agg_df = df.groupby(x_col)[y_col].sum().reset_index().head(15)
            fig.add_trace(go.Bar(
                x=agg_df[x_col].astype(str),
                y=agg_df[y_col],
                marker=dict(color=COLORS[0]),
                name=y_col
            ))
        
        # Update layout
        fig.update_layout(
            title=title or f"{y_col} by {x_col}",
            xaxis_title=x_col.title() if chart_type != 'pie' else None,
            yaxis_title=y_col.title() if chart_type not in ['pie', 'histogram'] else None,
            hovermode='closest',
            template='plotly_dark',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)'
        )
        
        return {
            "type": chart_type,
            "title": title or f"{y_col} by {x_col}",
            "data": json.loads(fig.to_json()),
            "columns": {
                "x": x_col,
                "y": y_col
            }
        }
