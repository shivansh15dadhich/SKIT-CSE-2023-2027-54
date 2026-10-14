# MindSense Backend

Initial backend foundation for the MindSense project.

## Phase 1 scope

- FastAPI service structure
- Environment-based MongoDB configuration
- Async MongoDB connection setup
- Initial database indexes
- Pydantic request/response schemas
- Basic health endpoint

## Current endpoints

- GET /api/health

Expected response when MongoDB is available:

```json
{"status": "ok", "database": "connected"}