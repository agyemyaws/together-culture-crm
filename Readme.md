# Together Culture CRM

A Customer Relationship Management (CRM) system for Together Culture, designed to facilitate community engagement, and track member activities.

## Features

- Member data management and profiles
- Membership tier differentiation
- Event and digital content management

## Installation

### Backend Setup

1. Clone the repository
```bash
git clone https://github.com/aws-crm/together-culture-crm.git
cd together-culture-crm
```

2. Create and activate virtual environment
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
```

3. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

4. Configure environment variables
Create a `.env` file in the backend directory with:
```env
SECRET_KEY=secret
```

5. Run migrations
```bash
python manage.py migrate
```

6. Create superuser
```bash
python manage.py createsuperuser
```

7. Start the development server
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to frontend directory
```bash
cd frontend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file in the frontend directory with:
```env
VITE_API_BASE_URL=http://localhost:8000
```

4. Start the development server
```bash
npm run dev
```

## Project Structure

```
together-culture-crm/
├── backend/           # Django backend application
├── frontend/          # Vite + React frontend application
├── .venv/            # Python virtual environment
└── .gitignore        # Git ignore rules
```

## Contributing

1. Create your feature branch (`git checkout -b branch-name`)
2. Commit your changes (`git commit -m 'description of changes'`)
3. Push to the branch (`git push origin branch-name`)
4. Open a Pull Request
