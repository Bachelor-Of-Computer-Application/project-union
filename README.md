# FoodExpress

## Run the project

```bash
# Backend
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py shell < seed.py   # optional — populates test data
python manage.py runserver 0.0.0.0:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in browser.

## Credentials

| Role     | Username     | Password     |
|----------|-------------|--------------|
| Admin    | `admin`     | `password123`|
| Customer | `customer1`–`customer6` | `password123` |

## Seed Data

Run `python manage.py shell < seed.py` to populate 14 menu items, 10 inventory items, 17 recipe links (auto stock deduction), and 13 orders across all statuses. The script is idempotent — safe to run multiple times.
