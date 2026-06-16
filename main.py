import sqlite3
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

app = FastAPI(title="Numera API")
DB_FILE = "numera.db"
CONFIG_FILE = "config.json"
GAMES_FILE = "games.json"

# --- Content Loaders ---
def load_json_file(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"{filepath} is missing. Please create it.")
    with open(filepath, 'r') as f:
        return json.load(f)

# --- Database Initialization (State Only) ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # Now the DB ONLY cares about state tracking!
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_states (
            id TEXT PRIMARY KEY,
            is_published BOOLEAN NOT NULL CHECK (is_published IN (0, 1))
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Helper: Stitch JSON Content with DB State ---
def get_stitched_games():
    games = load_json_file(GAMES_FILE)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, is_published FROM game_states")
    states = {row[0]: bool(row[1]) for row in cursor.fetchall()}
    conn.close()
    
    # Inject the dynamic DB state into the static JSON definitions
    for game in games:
        game['is_published'] = states.get(game['id'], False) # Default to false if never published
        
    return games

# --- API Endpoints ---

@app.get("/api/config")
def get_master_config():
    """Returns the master template configurations."""
    return JSONResponse(content=load_json_file(CONFIG_FILE))

@app.get("/api/admin/games")
def get_all_games():
    """Parent endpoint: Returns all games."""
    return get_stitched_games()

@app.get("/api/games/published")
def get_published_games():
    """Kid endpoint: Returns only published games."""
    all_games = get_stitched_games()
    return [g for g in all_games if g['is_published']]

@app.post("/api/admin/games/{game_id}/toggle-publish")
def toggle_publish(game_id: str):
    """Parent endpoint: Upserts the publish state."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT is_published FROM game_states WHERE id = ?", (game_id,))
    row = cursor.fetchone()
    
    if row:
        new_state = 0 if row[0] == 1 else 1
        cursor.execute("UPDATE game_states SET is_published = ? WHERE id = ?", (new_state, game_id))
    else:
        new_state = 1
        cursor.execute("INSERT INTO game_states (id, is_published) VALUES (?, 1)", (game_id,))
        
    conn.commit()
    conn.close()
    return {"id": game_id, "is_published": bool(new_state)}

@app.get("/api/games/{game_id}")
def get_game(game_id: str):
    """Kid endpoint: Returns details for a specific game."""
    all_games = get_stitched_games()
    for game in all_games:
        if game['id'] == game_id:
            return game
    raise HTTPException(status_code=404, detail="Game not found")

# --- Static File Routing ---
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_kid_app():
    return FileResponse("static/index.html")

@app.get("/admin")
def serve_admin_app():
    return FileResponse("static/admin.html")