# Excel to Delete Service

Microservice for handling company and round deletion operations.

## Features

- 🗑️ Cascading company deletion
- 🔄 Round deletion with student updates
- 🔐 JWT authentication
- ✅ Optimized Firestore queries (87-97% read reduction)
- 📊 Automatic systemStats updates

## Setup

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   - Copy `.env` and update values
   - Ensure `FIREBASE_CREDENTIALS_PATH` points to your credentials file
   - Set `JWT_SECRET_KEY` to match authentication service

3. **Run the service:**
   ```bash
   python api.py
   ```
   Service runs on `http://localhost:5004`

### Production Deployment

**Docker:**
```bash
docker build -t excel-to-delete .
docker run -p 5004:5004 --env-file .env excel-to-delete
```

**Gunicorn:**
```bash
gunicorn --bind 0.0.0.0:5004 --timeout 120 --workers 2 api:app
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/set-token
Body: { "accessToken": "...", "refreshToken": "..." }
```

### Delete Company
```
DELETE /api/companies/<company_year_id>?company_name=Google&year=2026
Headers: Cookie: accessToken=...
```

### Delete Round
```
DELETE /api/companies/<company_year_id>/rounds/<round_id>?round_number=2
Headers: Cookie: accessToken=...
```

## Environment Variables

```env
FLASK_HOST=0.0.0.0
FLASK_PORT=5004
FLASK_DEBUG=False
FIREBASE_CREDENTIALS_PATH=../authentication/serviceAccountKey.json
JWT_SECRET_KEY=your-secret-key-here
FIRESTORE_BATCH_SIZE=500
LOG_LEVEL=INFO
```

## Architecture

```
excel_to_delete/
├── api.py                  # Flask application
├── delete_operations.py    # Core deletion logic
├── auth_utils.py           # JWT authentication
├── firebase_init.py        # Firebase setup
├── config.py               # Configuration
├── requirements.txt        # Dependencies
├── Dockerfile             # Container config
└── .env                   # Environment variables
```

## Integration

### Frontend

Update frontend to call delete service:

```typescript
const DELETE_API_URL = 'http://localhost:5004/api';

async deleteCompany(companyId: string, companyName: string, year: number) {
  const url = `${DELETE_API_URL}/companies/${companyId}?company_name=${companyName}&year=${year}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  return response.json();
}
```

### Token Sync

After login, set tokens on all services:

```typescript
await setDeleteToken(accessToken, refreshToken);
```

## Optimizations

✅ **Targeted Queries**: Uses `array_contains` to only read affected students (10-50 instead of 401)  
✅ **Batched Operations**: Commits in batches of 500 for efficiency  
✅ **Atomic Updates**: Uses `Increment()` for counter updates  
✅ **Comprehensive Logging**: Detailed logs for monitoring

## Monitoring

Check logs for:
- Authentication attempts
- Delete operations
- Student update counts
- Error traces

## Security

- JWT token required for all delete operations
- Tokens stored in httpOnly cookies
- CORS configured for specific origins
- All operations logged with user info

## License

Same as main project
