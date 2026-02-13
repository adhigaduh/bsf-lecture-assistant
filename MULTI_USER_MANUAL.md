# Multi-User & Multi-Document Features - User Manual

## Overview

BSF Lecture Assistant now supports multiple users working independently with multiple lecture documents. Each user can create, save, load, and manage their own lecture documents while keeping their work separate from others.

---

## 1. Authentication

### Signing In

1. When you visit http://localhost:3000, you'll be automatically redirected to the **Login** page
2. Enter your **email** and **password**
3. Click **"Sign In"**

### Auto-Registration

- **First-time users**: You don't need to pre-register. Just enter any email/password combination on your first visit, and a new account will be created for you.
- **Returning users**: Use the same email/password you used before to access your account.

### Logging Out

Click the **Logout** button on the Document Panel (toggle it on via the "Documents" button in the top-right header).

---

## 2. Creating a New Document

### Steps to Create a Document

1. Click the **"Documents"** button in the top-right header (toggle button - it turns blue when active)
2. The **Document Panel** opens on the right side of the screen
3. Scroll to **"Create New Document"** section
4. Enter a **Document Name** (e.g., "Zechariah 7-8 Lecture", "John 3:16 Talk")
5. Optionally add a **Description** (e.g., "Sunday morning service")
6. Click **"Create Document"**

**The document will be saved and automatically selected as the current document.**

### When to Create a Document

- **Before starting** a new lecture - to keep your work organized
- After completing a lecture - to save the final result
- For each different sermon topic - to manage them separately

---

## 3. Working with Documents

### Switching Between Documents

1. On the Document Panel:
   - Scroll down to **"Saved Documents"** section
   - Click on any document card (they show document name, description, and last updated date)
   - The application will load that document's complete state

**All saved data will be restored:**
- Uploaded text
- Selected strategic foundation option
- Selected narrative arc story
- Generated lecture
- Visual assets
- Current workflow phase

### Current Document Indicator

- When a document is loaded, its name appears in a badge next to the app title in the header
- The currently selected document is highlighted with a blue border and "Current" label
- This helps you quickly identify which document you're working on

### Deleting a Document

1. Open the Document Panel
2. Find the document you want to delete
3. Click the **trash can icon** in the top-right corner of the document card
4. Confirm the deletion when prompted

**Warning**:_deleted_ cannot be undone. Consider saving a backup if you need it.

---

## 4. Auto-Save Feature

### Automatic Saving

**The application automatically saves your work:**

- When you **switch phases** (click Previous/Next buttons)
- When you **switch documents** (load a different document)
- While you work (incremental saves may be added in future updates)

### What Gets Saved

The complete workflow state is saved for your selected document:
- Uploaded Bible text
- Strategic foundation options (3 options)
- Selected option (aim, divisions)
- Narrative story options (3 stories)
- Selected story (tone, opening, cliffhanger, resolution)
- Generated full lecture manuscript
- Application questions for all 3 age groups
- Worship song suggestions
- Generated visual assets (slide prompts)
- Generated images

### Manual Save

You can also manually trigger a save:
- (Coming soon) Save button or auto-save keyboard shortcut
- (Coming soon) Auto-save after each generation step completes

---

## 5. Multi-User System

### User Isolation

Each user operates independently:

- **Separate accounts**: Users log in with their own credentials
- **Separate documents**: Only see documents you created
- **No access to others**: Cannot see or modify other users' data
- **No collaboration**: Currently designed for individual use (collaboration features may be added later)

### Sharing Data

**Currently not supported** but planned:
- Export to share with others (Markdown file download)
- Document export/import (full state transfer)

---

## 6. Document Panel Overview

### Layout

The Document Panel is a right sidebar with two main sections:

**Top Section: Create New Document**
- Document name input field
- Description textarea
- "Create Document" button
- User info display (name, email)
- Logout button

**Bottom Section: Saved Documents**
- List of all your documents
- Each document card shows:
  - Document icon
  - Document name
  - Description (if provided)
  - Last updated date
  - "Current" badge (if selected)
  - Delete button

### Opening/Closing Document Panel

- Click **"Documents"** button in header to toggle it open/closed
- Closed: Saves screen space for lecture editing
- Open: Access to all document management features
- When closed, current document remains active (indicated in header)

---

## 7. Document Best Practices

### Naming Your Documents

**Good Examples:**
- 'Zechariah 7-8 - False Fasting'
- 'John 3:16 - For God So Loved'
- 'Ephesians 2 - Grace Talk 1'
- 'Genesis 1 Creation'

**Why meaningful names matter:**
- Easy to find when scrolling through list
- No need to open multiple documents to find content
- Better organization by series/topic

- Use consistent naming conventions (e.g., "Book - Chapter Number - Title")
- Update descriptions when documents progress (e.g., "Draft", "Complete", "v2 ready")

### Work Organization

**Recommended workflow:**
1. **Create a document** for each sermon/lecture series
2. **Work through the 4 phases** for each document
3. **Save the lecture** (as markdown) when complete
4. **Keep generating images** in Phase 5
5. **Switch to the next document** when current is finished

### Managing Work in Progress

**Tips for smooth workflow:**
- **Save frequently** by switching between phases - this triggers auto-save
- **Load documents only when ready** - the app preserves your last document automatically
- **Don't create too many drafts** - complete and organize before starting new ones
- **Delete test documents** to keep your list clean

---

## 8. Troubleshooting

### "Login Failed" Error

- **Check**: Ensure you're using the same email/password as before
- **Try**: Create a new account with different credentials

### "Document Not Found"

- **Cause**: Document may have been deleted by another user (in future multi-user version)
- **Fix**: Reload the app or create a new document

### "Cannot Load Document"

- **Check**: Document file may be corrupted
- **Fix**: Delete and recreate the document

### Auto-save Not Working

- **Make sure**: You're logged in (check if Login page shows)
- **Try**: Manually toggle to another phase to trigger save

### Can't See Documents

- **Possible cause**: API error or directory permissions
- **Try**: Refresh page and check if logged in
- **Restart**: Close/reopen app if issues persist

---

## 9. Data Storage

### Where Documents Are Stored

**Local Development**: `/documents/<userId>/` directory (file system)

**Example paths**:
```
/documents/user-abc123/doc-xyz-789.json
/documents/def456/doc-xyz-789.json
```

### File Format

Each document is stored as a JSON file containing:
- Document metadata (id, userId, name, description, createdAt, updatedAt)
- Complete workflow state (all 4 phases data)
- Current phase, uploaded text, selected options, generated content

**Note**: Files are NOT backed up automatically. Regular backups are recommended for production use.

---

## 10. Future Enhancements

Coming in future updates:

- Real-time collaboration (multiple users editing same document)
- Document sharing via email
- Document templates
- Version history (save snapshots as you work)
- Document search within your list
- Cloud storage backup
- Team management features

---

## Summary

The multi-user and multi-document system enables:
- **Multiple users** to work on the application independently
- **Multiple documents** per user for organizing different sermons/lectures
- **Auto-save** functionality to prevent data loss
- **Easy switching** between documents to continue work
- **Document management** with create, save, load, and delete

For help, refer to the main **TECHNICAL_DOCS.md** or **DEPLOYMENT.md**.
