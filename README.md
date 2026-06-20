# Numera & Litera: Play, Count, and Learn 🎈🔤

Numera (with its parallel Litera segment) is a lightweight, responsive Single Page Application (SPA) designed to help toddlers learn math, counting, letters, and basic words through simple, playful tasks. 

It bridges the gap between screen time and physical play by offering a unique **Dual-Mode** experience. Games can be played purely digitally on a screen, or the app can act as an interactive companion that prompts real-world tactile activities.

## 🌟 Features

* **Multi-Section Learning Dashboard:** 
  * **Numera (Numbers):** High-contrast counting, grouping, and action games.
  * **Litera (Words/Letters):** Dynamic letter-matching and spelling games.
* **Kid-Friendly UI:** Large hitboxes, bold emojis, and adaptive background theme colors designed specifically for a 2-year-old's motor skills.
* **Parent Portal:** An administrative backend to configure, test, and safely publish/unpublish games to each dashboard section.
* **Dual-Mode Play:**
  * **Digital Mode:** Interactive drag-and-drop and tap mechanics directly on the tablet/phone.
  * **Companion Mode:** Audio and visual prompts guiding the child to complete tasks with physical toys in the room.

## 🛠 Tech Stack

Designed to be ultra-lightweight, easy to debug, and highly portable.

* **Backend:** Python 3, FastAPI, Uvicorn, SQLite (Zero-configuration persistence)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (No heavy frameworks)
* **Testing:** Pytest, HTTPX

## 🚀 Quick Start (Linux)

### 1. Run the Server
Simply run the shell-independent execution script (fully compatible with both Bash and Fish shells):
```bash
chmod +x run.sh
./run.sh
```
This automatically sets up a python virtual environment (`venv`), installs/verifies all dependencies, and boots the production server.

### 2. Access the App
* **Kid Dashboard (Numera & Litera):** `http://localhost:9025/`
* **Parent Portal (Admin):** `http://localhost:9025/admin`
*(Note: To test on a tablet or phone, find your Linux machine's local IP address and navigate to `http://<YOUR-IP>:9025` on the device).*

### 3. Run Unit Tests
To run unit and integration tests:
```bash
python3 -m pytest tests/
```

## 📁 Project Structure

```text
numera/
├── main.py               # FastAPI server, SQLite init, and API endpoints
├── run.sh                # Production execution script (Bash & Fish compatible)
├── requirements.txt      # Python dependencies
├── config.json           # Master configurations, template defaults, and sections config
├── games.json            # Game definitions, overriding configs, and sections
├── tests/                # Pytest unit and integration test suite
└── static/               # Frontend SPA files
    ├── index.html        # Kid-facing learning dashboard
    ├── admin.html        # Parent control portal
    ├── css/              # Stylesheets (dashboard, admin)
    └── js/               # Javascript modules and template layouts
```