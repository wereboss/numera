import pytest
import os
import re
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_api_config():
    """Test that the /api/config endpoint returns the sections and templates."""
    response = client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    
    assert "sections" in data
    assert "templates" in data
    
    sections = data["sections"]
    assert len(sections) >= 2
    
    section_ids = [s["id"] for s in sections]
    assert "numera" in section_ids
    assert "litera" in section_ids
    
    for s in sections:
        assert "title" in s
        assert "background_color" in s
        assert "primary_color" in s

def test_api_admin_games():
    """Test that /api/admin/games returns all games stitched with section properties."""
    response = client.get("/api/admin/games")
    assert response.status_code == 200
    games = response.json()
    
    assert len(games) > 0
    for game in games:
        assert "id" in game
        assert "title" in game
        assert "section" in game
        assert game["section"] in ["numera", "litera"]

def test_new_game_starting_letters():
    """Test details of the newly added starting_letters Litera game."""
    response = client.get("/api/games/starting_letters")
    assert response.status_code == 200
    game = response.json()
    
    assert game["id"] == "starting_letters"
    assert game["section"] == "litera"
    assert game["template_type"] == "template_c"
    assert "digital" in game["config"]
    assert "start_message" in game["config"]["digital"]
    assert game["config"]["digital"]["start_message"] == "Match the emojis to their starting letters"

def test_js_and_html_integrations():
    """Verify that frontend assets contain the necessary integration points for Litera."""
    # 1. Verify index.html contains the section-tabs container
    index_path = os.path.join("static", "index.html")
    assert os.path.exists(index_path)
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert 'id="section-tabs"' in index_content
    assert 'id="app-title"' in index_content

    # 2. Verify admin.html contains the admin-sections-container
    admin_html_path = os.path.join("static", "admin.html")
    assert os.path.exists(admin_html_path)
    with open(admin_html_path, "r", encoding="utf-8") as f:
        admin_content = f.read()
    assert 'id="admin-sections-container"' in admin_content

    # 3. Verify app.js contains the activeSection and sectionsList logic
    app_js_path = os.path.join("static", "js", "app.js")
    assert os.path.exists(app_js_path)
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()
    assert "activeSection" in app_js_content
    assert "sectionsList" in app_js_content
    assert "renderSectionTabs" in app_js_content
    assert "applySectionStyle" in app_js_content

    # 4. Verify template_c.js uses the configurable start_message
    template_c_path = os.path.join("static", "js", "games", "template_c.js")
    assert os.path.exists(template_c_path)
    with open(template_c_path, "r", encoding="utf-8") as f:
        template_c_content = f.read()
    assert "start_message" in template_c_content

def test_new_game_word_match():
    """Test details of the newly added word_match Litera game (Template E)."""
    response = client.get("/api/games/word_match")
    assert response.status_code == 200
    game = response.json()
    
    assert game["id"] == "word_match"
    assert game["section"] == "litera"
    assert game["template_type"] == "template_e"
    assert "digital" in game["config"]
    assert "items" in game["config"]["digital"]
    assert game["config"]["digital"]["rounds"] == 3
    
    # Verify word length constraint: 3 to 5 letters for all items
    for item in game["config"]["digital"]["items"]:
        assert len(item["word"]) >= 3
        assert len(item["word"]) <= 5

def test_template_e_config():
    """Test defaults for template_e inside master configuration."""
    response = client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    
    assert "template_e" in data["templates"]
    template_e = data["templates"]["template_e"]
    assert template_e["digital"]["rounds"] == 3
    assert "distractors" in template_e["digital"]
    
    # Verify word length constraints for template_e distractors
    for d in template_e["digital"]["distractors"]:
        assert len(d) >= 3
        assert len(d) <= 5

def test_template_e_js_and_app_js():
    """Verify HTML script link and app.js routing for Template E."""
    # 1. Verify index.html loads template_e.js
    index_path = os.path.join("static", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert 'src="/static/js/games/template_e.js"' in index_content

    # 2. Verify app.js routes template_e
    app_js_path = os.path.join("static", "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()
    assert "template_e" in app_js_content
    assert "TemplateE.init" in app_js_content

    # 3. Verify template_e.js contains uppercase logic and smart first letter distractor matching
    template_e_path = os.path.join("static", "js", "games", "template_e.js")
    assert os.path.exists(template_e_path)
    with open(template_e_path, "r", encoding="utf-8") as f:
        template_e_content = f.read()
    assert "toUpperCase()" in template_e_content
    assert "targetFirstLetter" in template_e_content

def test_new_game_emoji_match():
    """Test details of the newly added emoji_match Litera game (Template C with text slots)."""
    response = client.get("/api/games/emoji_match")
    assert response.status_code == 200
    game = response.json()
    
    assert game["id"] == "emoji_match"
    assert game["section"] == "litera"
    assert game["template_type"] == "template_c"
    assert "digital" in game["config"]
    assert "receivers" in game["config"]["digital"]
    
    # Verify word length constraint: 3 to 5 letters for all receivers' idle words
    for rec in game["config"]["digital"]["receivers"]:
        assert len(rec["idle"]) >= 3
        assert len(rec["idle"]) <= 5
        assert rec["idle"] == rec["idle"].upper() # Word should be in uppercase

def test_new_game_drag_spell():
    """Test details of the newly added drag_spell Litera game (Template F)."""
    response = client.get("/api/games/drag_spell")
    assert response.status_code == 200
    game = response.json()
    
    assert game["id"] == "drag_spell"
    assert game["section"] == "litera"
    assert game["template_type"] == "template_f"
    assert "digital" in game["config"]
    assert "items" in game["config"]["digital"]
    
    # Verify word length constraint: 3 to 5 letters for all items
    for item in game["config"]["digital"]["items"]:
        assert len(item["word"]) >= 3
        assert len(item["word"]) <= 5

def test_template_f_js_and_app_js():
    """Verify HTML script link and app.js routing for Template F."""
    # 1. Verify index.html loads template_f.js
    index_path = os.path.join("static", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert 'src="/static/js/games/template_f.js"' in index_content

    # 2. Verify app.js routes template_f
    app_js_path = os.path.join("static", "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()
    assert "template_f" in app_js_content
    assert "TemplateF.init" in app_js_content

    # 3. Verify template_f.js contains pre-population logic, collision logic, and dynamic missing tiles
    template_f_path = os.path.join("static", "js", "games", "template_f.js")
    assert os.path.exists(template_f_path)
    with open(template_f_path, "r", encoding="utf-8") as f:
        template_f_content = f.read()
    assert "numRevealed" in template_f_content
    assert "missingLetters" in template_f_content
    assert "makeDraggable" in template_f_content

def test_new_game_odd_one_out():
    """Test details of the newly added odd_one_out Numera game (Template G)."""
    response = client.get("/api/games/odd_one_out")
    assert response.status_code == 200
    game = response.json()
    
    assert game["id"] == "odd_one_out"
    assert game["section"] == "numera"
    assert game["template_type"] == "template_g"

def test_template_g_js_and_app_js():
    """Verify HTML script link and app.js routing for Template G."""
    # 1. Verify index.html loads template_g.js
    index_path = os.path.join("static", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert 'src="/static/js/games/template_g.js"' in index_content

    # 2. Verify app.js routes template_g
    app_js_path = os.path.join("static", "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()
    assert "template_g" in app_js_content
    assert "TemplateG.init" in app_js_content

    # 3. Verify template_g.js contains mainCatKey, isOdd, and handleCardTap
    template_g_path = os.path.join("static", "js", "games", "template_g.js")
    assert os.path.exists(template_g_path)
    with open(template_g_path, "r", encoding="utf-8") as f:
        template_g_content = f.read()
    assert "mainCatKey" in template_g_content
    assert "isOdd" in template_g_content
    assert "handleCardTap" in template_g_content

def test_new_game_sound_match():
    """Test details of the newly added sound_match Litera game (Template H)."""
    response = client.get("/api/games/sound_match")
    assert response.status_code == 200
    game = response.json()
    
    assert game["id"] == "sound_match"
    assert game["section"] == "litera"
    assert game["template_type"] == "template_h"

def test_template_h_js_and_app_js():
    """Verify HTML script link and app.js routing for Template H."""
    # 1. Verify index.html loads template_h.js
    index_path = os.path.join("static", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert 'src="/static/js/games/template_h.js"' in index_content

    # 2. Verify app.js routes template_h
    app_js_path = os.path.join("static", "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()
    assert "template_h" in app_js_content
    assert "TemplateH.init" in app_js_content

    # 3. Verify template_h.js contains speakPrompt, Hear Again, and handleCardTap
    template_h_path = os.path.join("static", "js", "games", "template_h.js")
    assert os.path.exists(template_h_path)
    with open(template_h_path, "r", encoding="utf-8") as f:
        template_h_content = f.read()
    assert "speakPrompt" in template_h_content
    assert "HEAR AGAIN" in template_h_content
    assert "handleCardTap" in template_h_content

def test_new_games_line_match():
    """Test details of the newly added match_counts and match_names games (Template I)."""
    # 1. Match Counts
    response = client.get("/api/games/match_counts")
    assert response.status_code == 200
    game = response.json()
    assert game["id"] == "match_counts"
    assert game["section"] == "numera"
    assert game["template_type"] == "template_i"
    assert game["config"]["digital"]["game_type"] == "counts"

    # 2. Match Names
    response = client.get("/api/games/match_names")
    assert response.status_code == 200
    game = response.json()
    assert game["id"] == "match_names"
    assert game["section"] == "litera"
    assert game["template_type"] == "template_i"
    assert game["config"]["digital"]["game_type"] == "names"

def test_template_i_js_and_app_js():
    """Verify HTML script link and app.js routing for Template I."""
    # 1. Verify index.html loads template_i.js
    index_path = os.path.join("static", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert 'src="/static/js/games/template_i.js"' in index_content

    # 2. Verify app.js routes template_i
    app_js_path = os.path.join("static", "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()
    assert "template_i" in app_js_content
    assert "TemplateI.init" in app_js_content

    # 3. Verify template_i.js contains drawLines, resizeCanvas, and bindDotEvents
    template_i_path = os.path.join("static", "js", "games", "template_i.js")
    assert os.path.exists(template_i_path)
    with open(template_i_path, "r", encoding="utf-8") as f:
        template_i_content = f.read()
    assert "drawLines" in template_i_content
    assert "resizeCanvas" in template_i_content
    assert "bindDotEvents" in template_i_content

def test_new_games_counting_addition_helper():
    """Test details of the newly added touch_count and touch_addition games (Template J)."""
    # 1. Touch Count Game
    response = client.get("/api/games/touch_count")
    assert response.status_code == 200
    game = response.json()
    assert game["id"] == "touch_count"
    assert game["section"] == "numera"
    assert game["template_type"] == "template_j"
    assert game["config"]["digital"]["game_type"] == "counting"

    # 2. Touch Addition Game
    response = client.get("/api/games/touch_addition")
    assert response.status_code == 200
    game = response.json()
    assert game["id"] == "touch_addition"
    assert game["section"] == "numera"
    assert game["template_type"] == "template_j"
    assert game["config"]["digital"]["game_type"] == "addition"

def test_template_j_js_and_app_js():
    """Verify HTML script link and app.js routing for Template J."""
    # 1. Verify index.html loads template_j.js
    index_path = os.path.join("static", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()
    assert 'src="/static/js/games/template_j.js"' in index_content

    # 2. Verify app.js routes template_j
    app_js_path = os.path.join("static", "js", "app.js")
    with open(app_js_path, "r", encoding="utf-8") as f:
        app_js_content = f.read()
    assert "template_j" in app_js_content
    assert "TemplateJ.init" in app_js_content

    # 3. Verify template_j.js contains key functions
    template_j_path = os.path.join("static", "js", "games", "template_j.js")
    assert os.path.exists(template_j_path)
    with open(template_j_path, "r", encoding="utf-8") as f:
        template_j_content = f.read()
    assert "startRound" in template_j_content
    assert "handleEmojiTap" in template_j_content
    assert "handleChoiceTap" in template_j_content
    assert "generateChoices" in template_j_content
