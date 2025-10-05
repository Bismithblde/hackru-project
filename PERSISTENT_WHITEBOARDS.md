# 💾 Persistent Whiteboards Feature

## Overview

This feature allows users to save their Excalidraw whiteboards and share them via permanent links. Saved whiteboards can be viewed and edited later without needing to join the original study room.

## How It Works

### For Users

1. **Create/Draw**: Use the whiteboard in any study room
2. **Save**: Click the "💾 Save Whiteboard" button
3. **Share**: The link is automatically copied to clipboard
4. **Access Later**: Visit the link anytime to view/edit the whiteboard

### Technical Implementation

#### Backend
- **Storage**: JSON files in `server/saved-whiteboards/` directory
- **API Endpoints**:
  - `POST /api/whiteboards/save` - Save a whiteboard
  - `GET /api/whiteboards/:id` - Load a saved whiteboard
  - `GET /api/whiteboards` - List all saved whiteboards (admin)
  - `DELETE /api/whiteboards/:id` - Delete a whiteboard

#### Frontend
- **Save Button**: Added to Whiteboard component (left side)
- **Route**: `/whiteboard/:id` - View saved whiteboards
- **Component**: `SavedWhiteboard.tsx` - Dedicated viewer page

## API Usage

### Save a Whiteboard

```bash
POST http://localhost:4000/api/whiteboards/save
Content-Type: application/json

{
  "elements": [...],      # Excalidraw elements array
  "appState": {...},      # Excalidraw app state
  "roomId": "study-123"   # Optional room reference
}
```

**Response:**
```json
{
  "success": true,
  "whiteboardId": "a1b2c3d4e5f6g7h8",
  "url": "/whiteboard/a1b2c3d4e5f6g7h8",
  "shareableLink": "http://localhost:5173/whiteboard/a1b2c3d4e5f6g7h8"
}
```

### Load a Whiteboard

```bash
GET http://localhost:4000/api/whiteboards/a1b2c3d4e5f6g7h8
```

**Response:**
```json
{
  "success": true,
  "whiteboard": {
    "id": "a1b2c3d4e5f6g7h8",
    "roomId": "study-123",
    "elements": [...],
    "appState": {...},
    "createdAt": "2025-10-05T12:00:00.000Z",
    "version": 1
  }
}
```

## File Structure

```
server/
├── src/
│   └── controllers/
│       └── whiteboardController.js   # API logic
└── saved-whiteboards/                # Storage directory
    ├── README.md                      # Documentation
    └── a1b2c3d4e5f6g7h8.json        # Example saved whiteboard

client/
└── src/
    ├── components/
    │   └── Whiteboard.tsx            # Save functionality
    └── pages/
        └── SavedWhiteboard.tsx       # Viewer page
```

## Features

✅ **No Database Required** - Simple file-based storage
✅ **Shareable Links** - Each whiteboard gets a unique URL
✅ **Auto-Copy** - Link automatically copied to clipboard
✅ **View Anytime** - Access saved whiteboards without joining a room
✅ **Export** - Use Excalidraw's built-in export (PNG, SVG, etc.)

## Limitations & Future Enhancements

### Current Limitations
- No authentication - anyone with the link can view
- No expiration - files persist forever
- No edit tracking - can't see who modified what
- No versioning - only latest state is saved

### Possible Enhancements

1. **Add Expiration**
   ```javascript
   // Auto-delete whiteboards after 30 days
   const expirationDate = new Date();
   expirationDate.setDate(expirationDate.getDate() + 30);
   ```

2. **Add Authentication**
   - Require login to save whiteboards
   - Only creator can edit/delete
   - Share permissions (view-only vs edit)

3. **Version History**
   - Save multiple snapshots over time
   - "Time travel" through changes
   - Compare different versions

4. **Database Migration**
   - Move from files to MongoDB/PostgreSQL
   - Better querying and management
   - Add metadata (tags, descriptions, thumbnails)

5. **Rate Limiting**
   ```javascript
   // Limit saves per IP/user
   const rateLimit = require('express-rate-limit');
   ```

## Security Considerations

⚠️ **Important Notes:**

- Whiteboard IDs are 16-character hex strings (128 bits) - hard to guess but not encrypted
- No authentication means anyone with the link can view/edit
- No input validation on whiteboard content - could store malicious data
- No file size limits - could fill disk space
- No CORS restrictions on whiteboard endpoints

**For Production:**
- Add authentication/authorization
- Implement rate limiting
- Validate and sanitize whiteboard content
- Set file size limits
- Add CORS restrictions
- Implement automatic cleanup/expiration
- Use a database instead of files

## Example Usage

### Save Current Whiteboard
```typescript
// In Whiteboard component
const handleSave = async () => {
  const elements = excalidrawAPI.getSceneElements();
  const appState = excalidrawAPI.getAppState();
  
  const response = await fetch('/api/whiteboards/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ elements, appState, roomId })
  });
  
  const data = await response.json();
  console.log('Saved:', data.shareableLink);
};
```

### Load Saved Whiteboard
```typescript
// In SavedWhiteboard component
const loadWhiteboard = async (id: string) => {
  const response = await fetch(`/api/whiteboards/${id}`);
  const data = await response.json();
  
  if (data.success) {
    excalidrawAPI.updateScene({
      elements: data.whiteboard.elements,
      appState: data.whiteboard.appState
    });
  }
};
```

## Testing

```bash
# Start the server
cd server
npm run dev

# In another terminal, save a test whiteboard
curl -X POST http://localhost:4000/api/whiteboards/save \
  -H "Content-Type: application/json" \
  -d '{"elements":[],"appState":{},"roomId":"test"}'

# Response will include the whiteboard ID
# Visit: http://localhost:5173/whiteboard/<id>
```

## Troubleshooting

**Issue: "Failed to save whiteboard"**
- Check server logs for errors
- Ensure `saved-whiteboards` directory exists and is writable
- Verify fetch URL matches server port

**Issue: "Whiteboard not found"**
- Verify the ID in the URL is correct
- Check that the JSON file exists in `saved-whiteboards/`
- Check server logs for file access errors

**Issue: "Link not copying to clipboard"**
- Requires HTTPS in production (clipboard API restriction)
- Fallback alert shows the link if copy fails

## Deployment Notes

When deploying to production:

1. **Environment Variables**
   ```bash
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Update Save Handler**
   ```javascript
   shareableLink: `${process.env.FRONTEND_URL}/whiteboard/${whiteboardId}`
   ```

3. **Consider Cloud Storage**
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage

4. **Add Monitoring**
   - Track save/load metrics
   - Monitor storage usage
   - Alert on errors
