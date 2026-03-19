# tests/test_api.py
# Using Arrange-Act-Assert pattern for clarity

def test_get_activities_returns_structure(client):
    # Arrange: client fixture
    # Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # check one activity exists and has expected keys
    assert "Chess Club" in data
    activity = data["Chess Club"]
    assert set(["description", "schedule", "max_participants", "participants"]).issubset(activity.keys())


def test_signup_success_adds_participant(client):
    # Arrange
    activity = "Chess Club"
    email = "new_student@example.com"

    # Act
    post = client.post(f"/activities/{activity}/signup?email={email}")

    # Assert
    assert post.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]


def test_signup_duplicate_returns_400(client):
    # Arrange
    activity = "Chess Club"
    email = "duplicate_student@example.com"

    # Act - first signup should succeed
    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    # Act - second signup should fail with 400
    r2 = client.post(f"/activities/{activity}/signup?email={email}")

    # Assert
    assert r1.status_code == 200
    assert r2.status_code == 400


def test_signup_full_returns_400(client):
    # Arrange
    import src.app as app_module

    activity = "Tennis Club"
    # fill participants to max
    max_p = app_module.activities[activity]["max_participants"]
    app_module.activities[activity]["participants"] = [f"p{i}@example.com" for i in range(max_p)]

    # Act
    r = client.post(f"/activities/{activity}/signup?email=overflow@example.com")

    # Assert
    assert r.status_code == 400


def test_unregister_success(client):
    # Arrange
    activity = "Basketball Team"
    email = "temp_student@example.com"

    # ensure participant exists
    r_add = client.post(f"/activities/{activity}/signup?email={email}")
    assert r_add.status_code == 200

    # Act - unregister
    r_del = client.delete(f"/activities/{activity}/signup?email={email}")

    # Assert
    assert r_del.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]
