# Content Library API Setup

## Environment Configuration

To use the Content Library with live APIs, you need to configure the following environment variable:

### Required Environment Variable

Add this to your `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

Replace `https://your-api-domain.com/api` with your actual API base URL.

## API Endpoints

The Content Library expects the following API endpoints to be available:

### Folder Management
- `GET /folders` - List folders with pagination
- `POST /folders` - Create new folder
- `GET /folders/{id}` - Get folder by ID
- `PATCH /folders/{id}` - Update folder
- `DELETE /folders/{id}` - Delete folder
- `PATCH /folders/{id}/brand-access` - Update folder brand access

### File Management
- `GET /files` - List files with pagination and filtering
- `POST /files` - Create file metadata
- `POST /files/upload` - Upload single file
- `POST /files/upload-multiple` - Upload multiple files
- `GET /files/{id}` - Get file by ID
- `PATCH /files/{id}` - Update file
- `DELETE /files/{id}` - Delete file
- `PATCH /files/{id}/brand-access` - Update file brand access
- `GET /files/{id}/download` - Download file
- `GET /files/{id}/serve` - Serve file inline

## Error Handling

The application includes proper error handling for:
- Network errors
- HTTP error status codes
- Authentication errors (401 redirects to login)
- Invalid responses

The axios client automatically handles:
- JWT token authentication from localStorage
- Request/response interceptors
- Automatic logout on 401 errors
- Proper error formatting

## Authentication

The axios client automatically includes Bearer token authentication from localStorage (`token` key). The API client handles:
- Automatic token injection in request headers
- Token refresh handling
- Automatic logout on authentication failures
