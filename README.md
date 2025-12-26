# Med tech
### Institutional Clinical Intelligence and Healthcare Administration

Med tech is a digital healthcare platform designed for high-availability clinical environments. The system integrates advanced clinical AI with a modern, high-trust design system to optimize the experience for both healthcare providers and patients.

## Core Features

- **Clinical Design System**: A standardized HSL-based interface utilizing glassmorphism and the Outfit typeface for enhanced professional readability.
- **AI-Driven Triage**: An intelligent decision support engine leveraging Gemini AI for patient assessment and priority categorization.
- **Clinical Assistant**: An AI-integrated pharmaceutical and symptomatic guidance tool built for real-time provider support.
- **Authentication Layer**: A secure, high-fidelity split-screen authentication portal with institutional security protocols.
- **Prescription Management**: Digital prescription issuance system integrated with diagnostic context and patient history.

## Technical Architecture

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS.
- **Backend API**: FastAPI (Python 3.10+), SQLAlchemy Core, Pydantic Schema.
- **Intelligence Core**: Google Gemini LLM Integration and specialized ML predictive models.

## Operational Deployment

### Automated Orchestration
The full system suite (Backend and Frontend) can be deployed using the integrated orchestration script:

```bash
# Set execution permissions
chmod +x start_full_system.sh

# Initialize and start full system
./start_full_system.sh
```

**Orchestration Details:**
- Automatic environment provisioning via `.env` templates.
- Recursive dependency resolution for both Python and Node.js runtimes.
- Parallel service management (Backend on Port 3001, Frontend on Port 8080).
- Automated health monitoring for service availability.

### Manual Configuration

**Backend (Python)**
1. Navigate to the `backend` directory.
2. Initialize environment: `cp .env.example .env`
3. Install requirements: `pip install -r requirements.txt`
4. Start service: `python3 app.py`

**Frontend (React)**
1. Navigate to the root directory.
2. Install dependencies: `npm install`
3. Execute development server: `npm run dev`

## API Documentation and Monitoring

Service diagnostic endpoints and interactive documentation are available at:
- **Swagger Documentation**: http://localhost:3001/docs
- **Health Monitoring**: `GET /health`

## System Termination
To decommission active services and release managed ports:
```bash
./stop_full_system.sh
```

