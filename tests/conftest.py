import copy
import pytest
from fastapi.testclient import TestClient
import src.app as app_module

# Snapshot the initial activities so tests can restore state
_original_activities = copy.deepcopy(app_module.activities)

@pytest.fixture
def client():
    with TestClient(app_module.app) as c:
        yield c

@pytest.fixture(autouse=True)
def reset_activities():
    # Restore activities before each test to ensure isolation
    app_module.activities = copy.deepcopy(_original_activities)
    yield
    app_module.activities = copy.deepcopy(_original_activities)
