import sqlite3
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Add these to your existing imports at the top
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Numera API")
DB_FILE = "numera.db"

# --- Database Initialization ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS games (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            icon TEXT NOT NULL,
            is_published BOOLEAN NOT NULL CHECK (is_published IN (0, 1)),
            has_digital_mode BOOLEAN NOT NULL CHECK (has_digital_mode IN (0, 1)),
            has_companion_mode BOOLEAN NOT NULL CHECK (has_companion_mode IN (0, 1))
        )
    ''')
    
    # Pre-populate the first game for testing Phase 1
    cursor.execute("SELECT COUNT(*) FROM games")
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO games (id, title, icon, is_published, has_digital_mode, has_companion_mode)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ("put_in_the_box", "Put-in-the-Box", "box.svg", 0, 1, 1))
        
    conn.commit()
    conn.close()

init_db()

# --- Helper to convert SQLite rows to dictionaries ---
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        # Convert SQLite 0/1 back to boolean for JSON
        val = row[idx]
        if col[0] in ['is_published', 'has_digital_mode', 'has_companion_mode']:
            val = bool(val)
        d[col[0]] = val
    return d

# --- API Endpoints ---

@app.get("/api/admin/games")
def get_all_games():
    """Parent endpoint: Returns all games."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM games")
    games = cursor.fetchall()
    conn.close()
    return games

@app.get("/api/games/published")
def get_published_games():
    """Kid endpoint: Returns only published games."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM games WHERE is_published = 1")
    games = cursor.fetchall()
    conn.close()
    return games

@app.get("/api/games/{game_id}")
def get_game(game_id: str):
    """Kid endpoint: Returns details for a specific game."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM games WHERE id = ?", (game_id,))
    game = cursor.fetchone()
    conn.close()
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
        
    return game    

@app.post("/api/admin/games/{game_id}/toggle-publish")
def toggle_publish(game_id: str):
    """Parent endpoint: Toggles the publish state of a game."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Get current state
    cursor.execute("SELECT is_published FROM games WHERE id = ?", (game_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Game not found")
        
    new_state = 0 if row[0] == 1 else 1
    
    cursor.execute("UPDATE games SET is_published = ? WHERE id = ?", (new_state, game_id))
    conn.commit()
    conn.close()
    
    return {"id": game_id, "is_published": bool(new_state)}

# We will mount static files here later once we build the frontend

# Add this at the very bottom of main.py
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def serve_kid_app():
    """Serves the main Numera Kid Dashboard."""
    return FileResponse("static/index.html")

@app.get("/admin")
def serve_admin_app():
    """Serves the Parent Portal."""
    return FileResponse("static/admin.html")