# Numera: Tiny Numbers, Big Smiles 🎈

Numera is a lightweight, responsive Single Page Application (SPA) designed to help toddlers learn math and counting through simple, playful tasks. 

It bridges the gap between screen time and physical play by offering a unique **Dual-Mode** experience. Games can be played purely digitally on a screen, or the app can act as an interactive companion that prompts real-world tactile activities.

## 🌟 Features

* **Kid-Friendly Dashboard:** A high-contrast, frictionless interface with massive hitboxes designed specifically for a 2-year-old's motor skills.
* **Parent Portal:** A hidden administrative backend to test, configure, and safely publish/unpublish games to the main dashboard.
* **Dual-Mode Play:**
  * **Digital Mode:** Interactive drag-and-drop and tap mechanics directly on the tablet.
  * **Companion Mode:** Audio and visual prompts guiding the child to complete counting tasks with physical toys in the room.

## 🛠 Tech Stack

Designed to be ultra-lightweight, easy to debug, and highly portable.

* **Backend:** Python 3, FastAPI, Uvicorn
* **Database:** SQLite (Zero-configuration persistence)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (No heavy frameworks)

## 🚀 Quick Start (Linux)

### 1. Setup the Environment
Clone the repository and set up a Python virtual environment:
\`\`\`bash
git clone <your-repo-url>
cd numera
python3 -m venv venv
source venv/bin/activate
\`\`\`

### 2. Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 3. Run the Server
\`\`\`bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

### 4. Access the App
* **Kid Dashboard (Numera):** `http://localhost:8000/`
* **Parent Portal (Admin):** `http://localhost:8000/admin`
*(Note: To test on a tablet or phone, find your Linux machine's local IP address and navigate to `http://<YOUR-IP>:8000` on the device).*

## 📁 Project Structure

\`\`\`text
numera/
├── main.py               # FastAPI server, SQLite init, and API endpoints
├── requirements.txt      # Python dependencies
├── .gitignore            # Git ignore rules
└── static/               # Frontend SPA files
    ├── index.html        # Kid-facing Numera dashboard
    └── admin.html        # Parent control portal
\`\`\`