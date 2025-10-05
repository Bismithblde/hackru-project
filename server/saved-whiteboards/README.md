# Saved Whiteboards Directory

This directory stores persistent whiteboard snapshots as JSON files.

## Structure

Each saved whiteboard is stored as a JSON file with the following naming convention:
```
<whiteboard-id>.json
```

## File Format

Each JSON file contains:
```json
{
  "id": "unique-16-char-hex-id",
  "roomId": "optional-room-id",
  "elements": [...], // Excalidraw elements array
  "appState": {...}, // Excalidraw app state
  "createdAt": "ISO-8601-timestamp",
  "version": 1
}
```

## Security Note

- Whiteboard IDs are randomly generated 16-character hex strings
- No authentication is required to view saved whiteboards (they're like shareable links)
- Consider adding expiration or cleanup policies for production use

## Storage Considerations

- Each whiteboard file is typically 1-50 KB depending on complexity
- No automatic cleanup - files persist indefinitely
- For production, consider:
  - Adding expiration dates
  - Implementing a cleanup cron job
  - Moving to a database for better management
  - Adding rate limiting on save operations
