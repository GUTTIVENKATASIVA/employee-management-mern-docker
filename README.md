# Employee Management System (MERN + Docker)

## About the Project
This project is an Employee Management System built using the MERN stack. It allows users to add, view, update, delete, and search employee details.

## Technologies Used
- React
- Node.js and Express.js
- MongoDB
- Docker and Docker Compose

## How to Run
1. Install and start Docker Desktop.
2. Open PowerShell in the project folder.
3. Run:

   ```bash
   docker compose up -d --build
   ```

4. Open http://localhost:8080 in your browser.

## Containers
- **Frontend:** React application served using Nginx
- **Backend:** Node.js and Express API
- **Database:** MongoDB

## Docker Configuration
Docker Compose runs the three services together. Ports are configured for the frontend, backend, and database. A named Docker volume is used to preserve MongoDB data.

## Conclusion
This project demonstrates how to run a MERN application using Docker containers and Docker Compose.