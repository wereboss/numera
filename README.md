# Numera & Litera: Play, Count, and Learn 🎈🔤

Numera (with its parallel Litera segment) is a lightweight, responsive Single Page Application (SPA) designed to help toddlers learn math, counting, letters, and basic words through simple, playful tasks. 

It bridges the gap between screen time and physical play by offering a unique **Dual-Mode** experience. Games can be played purely digitally on a screen, or the app can act as an interactive companion that prompts real-world tactile activities.

---

## 🌟 Features

* **Multi-Section Learning Dashboard:** 
  * **Numera (Numbers & Logic):** High-contrast counting, grouping, and action games.
  * **Litera (Letters & Spelling):** Letter-matching, word recognition, and drag-and-drop spelling games.
* **Kid-Friendly UI:** Large hitboxes, bold emojis, and adaptive background theme colors designed specifically for a 2-year-old's motor skills.
* **Parent Portal:** An administrative backend to configure, test, and safely publish/unpublish games to each dashboard section.
* **Dual-Mode Play:**
  * **Digital Mode:** Interactive drag-and-drop and tap mechanics directly on the tablet/phone.
  * **Companion Mode:** Audio and visual prompts guiding the child to complete tasks with physical toys in the room.

---

## 🧩 Game Templates

To keep development flexible and scalable, the application utilizes structured frontend layout engines (templates) loaded dynamically:

* **Template A (Multiple Choice):** Shows a target prompt (e.g., count objects) and giant button choices.
* **Template B (Giant Clicker):** A large 3D arcade button showing an emoji and a progress dot tracker for counting repetitions.
* **Template C (Split Screen Match):** A split-screen matching layout. Supports:
  * **Animal/Food Matching:** Dragging food items to matching animal slots.
  * **Starting Letters:** Dragging emojis to their corresponding styled **letter blocks** (covers 24 alphabet letters with dynamic shuffling).
* **Template D (Category Sorter):** Categorization game where items are sorted into distinct thematic buckets (e.g., Jungle vs. Farm animals).
* **Template E (Word Match):** Shows a target emoji alongside a 2x2 grid of uppercase word blocks. Includes smart distractors matching the target first-letter for educational challenge.
* **Template F (Spell Drag):** Drag-and-drop spelling. An emoji is displayed next to letters slots (revealing a dynamic number of letters as scaffolding). Toddlers drag missing letters from a grid. Includes wobbly red error animations and delayed snap-back.

---

## 🛠 Tech Stack

Designed to be ultra-lightweight, easy to debug, and highly portable.

* **Backend:** Python 3, FastAPI, Uvicorn, SQLite (Zero-configuration persistence)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (No heavy frameworks)
* **Testing:** Pytest, TestClient

---

## 🚀 Quick Start (Linux)

### 1. Run the Server
Simply run the execution script (fully compatible with both Bash and Fish shells):
```bash
chmod +x run.sh
./run.sh
```
This automatically sets up a Python virtual environment (`venv`), installs/verifies all dependencies, and boots the production server on port `9025`.

### 2. Access the App
* **Kid Dashboard (Numera & Litera):** `http://localhost:9025/`
* **Parent Portal (Admin):** `http://localhost:9025/admin`
*(Note: To test on a tablet or phone, find your local IP address and navigate to `http://<YOUR-IP>:9025` on the device).*

### 3. Run Unit Tests
To execute all backend and config integration tests:
```bash
PYTHONPATH=. venv/bin/pytest
```

---

## 📁 Project Structure

```text
numera/
├── main.py               # FastAPI server, SQLite init, and API endpoints
├── run.sh                # Setup and execution script
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