# X-29 Advance (`x-29-advance`) Firestore Backup, Restore & Verification Guide

This guide describes the local backup, automatic post-backup verification, restore, and deep verification system configured specifically for **X-29 Advance**.

---

## 1. System Architecture: Local System & Automatic Verification

The X-29 Advance backup system runs locally on your PC via Node.js scripts:

```text
START
  ↓
Create Firebase backup (READ-ONLY fetch from x-29-advance)
  ↓
Backup successfully written (Automatic\DD MM YYYY\HH MM AM/PM)
  ↓
Automatically run verification
  ↓
Compare exact backup against LIVE Firestore (READ-ONLY)
  ↓
Record verification result in logs/verification-log.txt & logs/backup-log.txt
  ↓
Finish (Exit code 0)
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

`D:\X-29-ADVANCE\X-29-advance-backups\`
- Automatic Backups: `D:\X-29-ADVANCE\X-29-advance-backups\Automatic\DD MM YYYY\HH MM AM/PM\`
- Manual Backups: `D:\X-29-ADVANCE\X-29-advance-backups\Manual\DD MM YYYY\HH MM AM/PM\`
- Centralized Logs: `D:\X-29-ADVANCE\X-29-advance-backups\logs\`

### Timestamp Naming Format
Folder names use 12-hour Bangladesh local time (`Asia/Dhaka` / UTC+6):

`DD MM YYYY\HH MM AM` or `DD MM YYYY\HH MM PM`

Examples:
- `Automatic\04 09 2026\11 00 PM\`
- `Manual\04 09 2026\03 30 PM\`

### Directory Layout
```text
X-29-advance-backups/
├── Automatic/
│   └── 04 09 2026/
│       └── 11 00 PM/
│           ├── firestore-backup.json
│           ├── firestore.json
│           └── metadata.json
├── Manual/
│   └── 04 09 2026/
│       └── 03 30 PM/
│           ├── firestore-backup.json
│           ├── firestore.json
│           └── metadata.json
└── logs/
    ├── backup-log.txt
    ├── verification-log.txt
    └── restore-log.txt
```

---

## 3. Dedicated Logs

### `logs/backup-log.txt`
Records start, completion, and failure for every manual and scheduled backup.

### `logs/verification-log.txt`
Every automatic backup immediately verifies the exact folder created against live Firestore and records the outcome:

#### Exact Match Format Example
```text
[04 09 2026 11 00 PM] AUTOMATIC BACKUP VERIFICATION
Backup: D:\X-29-ADVANCE\X-29-advance-backups\Automatic\04 09 2026\11 00 PM
Status: EXACT MATCH
Collections: 1
Documents: 1
Fields: 120
Arrays: 12
Objects: 24
Differences: 0
SHA-256: MATCH
Result: VERIFIED SUCCESSFULLY
Duration: 0.45s
```

---

## 4. How to Trigger Backups

### Automatic Scheduled Backup (Headless, Exit Codes):
```cmd
backup-auto.bat
```
or
```cmd
node scripts\backup.js --automatic
```

### Manual Interactive Backup:
```cmd
backup.bat
```
or
```cmd
node scripts\backup.js
```

---

## 5. Automated Schedule in Windows Task Scheduler

Configured via `scripts/setup-task.ps1` with task name **`X-29 Advance Automatic Backup`** with 4 daily triggers:
- **11:00 AM**
- **02:30 PM**
- **07:30 PM**
- **11:00 PM**

Command executed:
```cmd
cmd.exe /c backup-auto.bat
```
Working directory:
```cmd
D:\X-29-ADVANCE\X-29-advance-code
```

To register/update the task in Task Scheduler, run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup-task.ps1
```

---

## 6. How to Run Manual Deep Verification

To compare Live Firestore database against any backup snapshot:

```cmd
node scripts\verify-backup.js --latest
```
or
```cmd
verify.bat
```

---

## 7. How to Run Manual Restoration

Restoration is strictly manual, interactive, and safe:

1. Open terminal in `D:\X-29-ADVANCE\X-29-advance-code`.
2. Run:
   ```cmd
   restore.bat
   ```
   or
   ```cmd
   node scripts\restore.js
   ```
3. Select the desired backup folder from the menu.
4. Select restoration mode:
   - **`[1] SAFE RESTORE`**: Merges backup documents into Firestore non-destructively.
   - **`[2] FULL RESTORE`**: Destructive; wipes existing Firestore documents then restores exact backup state (requires typing `RESTORE`).

---

## 🛠 File Reference Overview
| File | Description |
| :--- | :--- |
| [`scripts/backup.js`](file:///D:/X-29-ADVANCE/X-29-advance-code/scripts/backup.js) | Core Firestore backup script with automatic post-backup verification. |
| [`scripts/verify-backup.js`](file:///D:/X-29-ADVANCE/X-29-advance-code/scripts/verify-backup.js) | Read-only deep verification system & verification logging engine. |
| [`scripts/restore.js`](file:///D:/X-29-ADVANCE/X-29-advance-code/scripts/restore.js) | Core safe/full Firestore restore script. |
| [`scripts/setup-task.ps1`](file:///D:/X-29-ADVANCE/X-29-advance-code/scripts/setup-task.ps1) | PowerShell script configuring Windows Task Scheduler for X-29 Advance. |
| [`backup.bat`](file:///D:/X-29-ADVANCE/X-29-advance-code/backup.bat) | 1-click Windows batch launcher for interactive manual backups. |
| [`backup-auto.bat`](file:///D:/X-29-ADVANCE/X-29-advance-code/backup-auto.bat) | Headless Windows batch launcher for Task Scheduler with exit codes. |
| [`verify.bat`](file:///D:/X-29-ADVANCE/X-29-advance-code/verify.bat) | 1-click Windows batch launcher for backup verification. |
| [`restore.bat`](file:///D:/X-29-ADVANCE/X-29-advance-code/restore.bat) | 1-click Windows batch launcher for restoration. |
| [`.gitignore`](file:///D:/X-29-ADVANCE/X-29-advance-code/.gitignore) | Excludes service account credentials and backups from Git. |
