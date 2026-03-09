FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port
EXPOSE 5004

# Run with gunicorn
CMD gunicorn --bind 0.0.0.0:${PORT:-5004} --timeout 120 --workers 2 api:app
