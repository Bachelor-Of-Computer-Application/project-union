# FoodExpress

## Run the project

```bash
# Backend
cd backend
source venv/bin/activate
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in browser. Admin user: `admin` / `password123`.
