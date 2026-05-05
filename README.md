# RIS Surveillance System (Reconnaissance & Intelligence System)

A futuristic, cyberpunk-themed surveillance application using React (frontend) and Flask with MediaPipe (backend) for real-time human pose analysis and anomaly detection.

## Features
- **Real-time Pose Detection**: Monitors human movement via local or remote cameras.
- **Anomaly Detection**: Detects suspicious gestures (e.g., hands raised above the head).
- **Cyberpunk HUD**: Immersive user interface with interactive logs and alerts.
- **Multi-language Support**: English and French translations.
- **History Management**: Review and manage detected incidents.

## Installation

### Prerequisites
- Python 3.10+
- Node.js & npm

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Usage
- Open your browser to the local URL provided by Vite (usually `http://localhost:5173`).
- Follow the on-screen boot sequence to initialize the system.
- Select your camera source in the control panel.

## License
Copyright © 2026 RATOVOARISOA MENDRIKA MANJAKA RICARDO.
Tous droits réservés. Voir le fichier `LICENSE` pour plus de détails.
