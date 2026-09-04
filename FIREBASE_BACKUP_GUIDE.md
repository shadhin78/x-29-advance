# X-29 (`x-29-advance`) Firestore Local Backup, Restore & Verification Guide

This guide describes the local backup, automatic post-backup verification, restore, and deep verification system for the X-29 Firebase Cloud Firestore database.

---

## 1. System Architecture: Local System & Automatic Verification

The X-29 backup system runs locally on your PC via Node.js scripts:

```text
START
  ↓
Create Firebase backup (READ-ONLY fetch)
  ↓
Backup successfully written (Automatic\DD MM YYYY\HH MM AM/PM)
  ↓
Automatically run verification
  ↓
Compare exact backup against LIVE Firestore (READ-ONLY)
  ↓
Record verification result in verification-log.txt & backup-log.txt
  ↓
Finish
```

> [!IMPORTANT]
> **READ-ONLY BACKUP & VERIFICATION GUARANTEE**:
> - Running `node scripts/backup.js` and `node scripts/verify-backup.js` is strictly **READ-ONLY** with respect to Firestore.
> - They will never modify, write, overwrite, delete, or restore Firestore documents.
> - Restoration is exclusively a separate manual process via `node scripts/restore.js`.

---

## 2. Backup Folder Structure & Naming Format

### Location
All local backups are stored under:

`D:\X-29 Project\X-29\X-29-Backups\`
- Automatic Backups: `D:\X-29 Project\X-29\X-29-Backups\Automatic\DD MM YYYY\HH MM AM/PM\`
- Manual Backups: `D:\X-29 Project\X-29\X-29-Backups\Manual\DD MM YYYY\HH MM AM/PM\`

### Timestamp Naming Format
Folder names use 12-hour Bangladesh local time (`Asia/Dhaka` / UTC+6):

`DD MM YYYY\HH MM AM` or `DD MM YYYY\HH MM PM`

Examples:
- `Automatic\15 08 2026\11 00 PM\`
- `Manual\15 08 2026\09 30 AM\`

### Directory Layout
```text
X-29-Backups/
├── Automatic/
│   └── 15 08 2026/
│       └── 11 00 PM/
│           ├── firestore-backup.json
│           ├── firestore.json
│           └── metadata.json
├── Manual/
│   └── 15 08 2026/
│       └── 09 30 AM/
│           ├── firestore-backup.json
│           ├── firestore.json
│           └── metadata.json
├── backup-log.txt
└── verification-log.txt
```

---

## 3. Dedicated Verification Log (`verification-log.txt`)

Every automatic backup immediately verifies the exact folder created and records the result in:

`D:\X-29 Project\X-29\X-29-Backups\verification-log.txt`

### Exact Match Format Example
```text
[15 08 2026 11 00 PM] AUTOMATIC BACKUP VERIFICATION
Backup: D:\X-29 Project\X-29\X-29-Backups\Automatic\15 08 2026\11 00 PM
Status: EXACT MATCH
Collections: 1
Documents: 1
Fields: 8465
Arrays: 791
Objects: 1351
Differences: 0
SHA-256: MATCH
Result: VERIFIED SUCCESSFULLY
Duration: 0.45s
```

### Mismatch Format Example
```text
[15 08 2026 11 00 PM] AUTOMATIC BACKUP VERIFICATION
Backup: D:\X-29 Project\X-29\X-29-Backups\Automatic\15 08 2026\11 00 PM
Status: MISMATCH

Collections:
Expected: 5
Backup: 5
Difference: 0

Documents:
Expected: 320
Backup: 318
Difference: 2

Fields:
Expected: 8465
Backup: 8441
Difference: 24

Arrays:
Expected: 791
Backup: 790
Difference: 1

Objects:
Expected: 1351
Backup: 1348
Difference: 3

SHA-256:
Expected: abc...
Backup: xyz...
Status: MISMATCH

Total Differences: 30
Result: VERIFICATION FAILED
Duration: 0.52s

DIFFERING DOCUMENTS:
- users/abc123

FIELD DIFFERENCES:
- users/abc123/profile/name
```

---

## 4. How to Trigger Backups

### Automatic Backup (with post-backup verification):
```cmd
node scripts\backup.js --automatic
```

### Manual Backup:
```cmd
node scripts\backup.js
```
(or double-click `backup.bat`)

---

## 5. Automated Schedule in Windows Task Scheduler

Configured via `scripts/setup-task.ps1` with 4 daily triggers:
- **11:00 AM**
- **02:30 PM**
- **07:30 PM**
- **11:00 PM**

Command executed:
```cmd
"C:\Program Files\nodejs\node.exe" scripts/backup.js --automatic
```

---

## 6. How to Run Manual Deep Verification

To compare Live Firestore database against any backup snapshot:

```cmd
node scripts\verify-backup.js --latest
```
or
```cmd
node scripts\verify-backup.js --backup "Automatic\15 08 2026\11 00 PM"
```
(or double-click `verify.bat`)

---

## 7. How to Run Manual Restoration

Restoration is strictly manual and interactive:

1. Open terminal in `X-29-Code`.
2. Run:
   ```cmd
   node scripts\restore.js
   ```
   (or double-click `restore.bat`)
3. Select the desired backup folder from the menu.
4. Select restoration mode:
   - **`[1] SAFE RESTORE`**: Merges backup documents into Firestore non-destructively.
   - **`[2] FULL RESTORE`**: Wipes existing Firestore documents then restores exact backup state (requires typing `RESTORE`).

---

## 🛠 File Reference Overview
| File | Description |
| :--- | :--- |
| [`scripts/backup.js`](file:///d:/X-29%20Project/X-29/X-29-Code/scripts/backup.js) | Core Firestore backup script with automatic post-backup verification. |
| [`scripts/verify-backup.js`](file:///d:/X-29%20Project/X-29/X-29-Code/scripts/verify-backup.js) | Read-only deep verification system & verification logging engine. |
| [`scripts/restore.js`](file:///d:/X-29%20Project/X-29/X-29-Code/scripts/restore.js) | Core safe/full Firestore restore script. |
| [`scripts/setup-task.ps1`](file:///d:/X-29%20Project/X-29/X-29-Code/scripts/setup-task.ps1) | PowerShell script configuring Windows Task Scheduler with 4 daily triggers. |
| [`backup.bat`](file:///d:/X-29%20Project/X-29/X-29-Code/backup.bat) | 1-click Windows batch launcher for manual backups. |
| [`verify.bat`](file:///d:/X-29%20Project/X-29/X-29-Code/verify.bat) | 1-click Windows batch launcher for backup verification. |
| [`restore.bat`](file:///d:/X-29%20Project/X-29/X-29-Code/restore.bat) | 1-click Windows batch launcher for restoration. |
| [`.gitignore`](file:///d:/X-29%20Project/X-29/X-29-Code/.gitignore) | Configured to ignore service account credentials. |
