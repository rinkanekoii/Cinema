# Cinema Hub - Database Setup

## SQL Files Overview

| # | File | Description | Run As |
|---|------|-------------|--------|
| 1 | `01_init_user.sql` | Create tablespace and user | SYS/SYSTEM |
| 2 | `02_grants.sql` | Grant privileges and roles | SYS/SYSTEM |
| 3 | `03_schema.sql` | Create tables, indexes, views | CINEMA_DB |
| 4 | `04_procedures.sql` | Create packages and procedures | CINEMA_DB |
| 5 | `05_policies.sql` | Security policies (VPD, FGA) | CINEMA_DB |
| 6 | `06_seeds.sql` | Sample data and test users | CINEMA_DB |

## Quick Setup

```bash
# Step 1-2: Run as SYS/SYSTEM
sqlplus sys/password@localhost:1521/XEPDB1 as sysdba
@sql/01_init_user.sql
@sql/02_grants.sql

# Step 3-6: Run as CINEMA_DB
sqlplus CINEMA_DB/cinema123@localhost:1521/XEPDB1
@sql/03_schema.sql
@sql/04_procedures.sql
@sql/05_policies.sql
@sql/06_seeds.sql
```

## Security Features

### Password Encryption (SHA-512)
- **Salt**: Random 32-byte value per user
- **Pepper**: Server-side secret key
- **Hash**: SHA-512 with Base64 encoding
- **Location**: `pkg_security` package

### Data Encryption (AES-256)
- Sensitive data encrypted using AES-256-CBC
- Used for phone numbers, card numbers, etc.

### Account Protection
- Auto-lock after 5 failed login attempts
- Password profile with expiry and reuse rules

## Test Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `staff` | `staff123` | NHAN_VIEN |
| `demo` | `demo123` | KHACH_HANG |

## .env Configuration

After running SQL scripts, update your `.env` file:

```env
DB_USER=CINEMA_DB
DB_PASSWORD=cinema123
DB_CONNECTION_STRING=localhost:1521/XEPDB1
JWT_SECRET=your_secret_key_here
# Remove DEMO_MODE line to use real database
```

## Packages

| Package | Purpose |
|---------|---------|
| `pkg_security` | Encryption, hashing, password verification |
| `pkg_user_management` | User registration, login, password change |
| `pkg_booking` | Ticket booking and cancellation |
| `pkg_session_context` | VPD session context management |

## Troubleshooting

### ORA-01017: invalid username/password
- Ensure you ran `01_init_user.sql` first
- Check password is `cinema123`

### ORA-00942: table or view does not exist
- Run scripts in order (01 → 06)
- Connect as CINEMA_DB for scripts 03-06

### Encryption errors
- Ensure `GRANT EXECUTE ON DBMS_CRYPTO TO CINEMA_DB` was run
