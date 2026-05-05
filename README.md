# AI Data Visualizer

A powerful AI-powered data visualization platform that transforms your data into interactive dashboards with natural language queries.

![Dashboard Preview](https://via.placeholder.com/800x400?text=AI+Data+Visualizer+Dashboard)

## Features

### 🚀 Auto-Generated Dashboard
- Instantly creates a beautiful PowerBI-like dashboard when you upload a CSV or Excel file
- Automatically generates 8+ visualization types (bar, line, pie, scatter, histogram, box plot, heatmap, etc.)
- Calculates key metrics (totals, averages, min/max values)

### 💬 Natural Language Queries
- Ask questions in plain English
- AI converts your queries to pandas code
- Get human-readable explanations with bold headers and bullet points

### 🎛️ Interactive Filters
- Dynamic filter slicers for categorical columns
- Real-time dashboard updates based on filters

### 📊 Visualization Types
- Bar Charts (vertical & horizontal)
- Line Charts
- Pie/Doughnut Charts
- Scatter Plots
- Histograms
- Box Plots
- Correlation Heatmaps

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pandas** - Data manipulation
- **Plotly** - Interactive visualizations
- **Groq** - LLM for natural language processing

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **Recharts/Plotly** - Charting library, plotly redefined up in the backend part but yeah we are using the recharts or later might be using the react charts for the use case of the graphs
- **Lucide React** - Icons,generally for the settings, search, visual, accessability and much more

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Groq API Key

### Installation

1. **Clone the repository**
```bash
git clone https://code.involead.com/shiv.thapa/visualization_llm.git
cd visualization_llm
```

2. **Set up backend**
```bash
cd backend
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

3. **Configure environment**
```bash
# Edit backend/.env and add your Groq API key
GROQ_API_KEY=your_api_key_here
```

4. **Set up frontend**
```bash
cd frontend
npm install
```

### Running the Application

1. **Start the backend**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

2. **Start the frontend** (in a new terminal)
```bash
cd frontend
npm run dev
```

3. **Open your browser**
Navigate to `http://localhost:3000`

## Usage

1. **Upload Data**: Click the upload button and select a CSV or Excel file
2. **View Dashboard**: The dashboard auto-generates with visualizations and metrics
3. **Apply Filters**: Use the filter slicers to narrow down your data
4. **Ask Questions**: Open the query modal and ask questions in natural language
5. **Get Insights**: Click "Generate Insights" for AI-powered data analysis

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload and process data file |
| `/api/data/{session_id}` | GET | Get processed data |
| `/api/query` | POST | Natural language query |
| `/api/insights` | POST | Generate AI insights |
| `/api/sample-visualizations/{session_id}` | GET | Get auto-generated visualizations |
| `/api/health` | GET | Health check |

## Project Structure

```
visualization_llm/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── data_processor.py    # Data processing utilities
│   ├── llm_generator.py     # LLM query generation
│   ├── visualization.py     # Chart generation
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Main page
│   │   ├── layout.tsx       # App layout
│   │   ├── globals.css      # Global styles
│   │   └── components/      # React components
│   │       ├── Header.tsx
│   │       ├── ConfigPanel.tsx
│   │       ├── VisualizationsTab.tsx
│   │       ├── QueryModal.tsx
│   │       └── ...
│   ├── package.json
│   └── tailwind.config.js
│
├── .gitignore
└── README.md
```

## Environment Variables

### Backend (.env)
```env
GROQ_API_KEY=your_groq_api_key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## License

MIT License - feel free to use this project for any purpose.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using FastAPI, Next.js, and Groq LLM
