# Bistro Delight (React JS)

## Overview

This frontend is a part of full-stack application **Restaurant Management** which consists of a separate Backend ([MenuCraft](https://github.com/Engarif3/restaurant-management)) built with Symfony and MariaDB, and this Frontend (**Bistro Delight**) developed by using React JS. The frontend communicates with the backend via RESTful APIs.

## Features

- Customers can:
  - Browse the restaurant menu.
  - Add items to their cart.
  - Modify item quantities.
  - Place orders.
- React Router for smooth navigation.
- Responsive design using TailwindCSS and DaisyUI.
- REST APIs for communication with the backend(**MenuCraft**).
- Docker for Containerization of the application.
- Docker Compose for Managing and orchestrating multiple containers.

## Technologies Used

- **Framework**: React
- **Styling**: TailwindCSS, DaisyUI
- **Icons**: React Icons
- **Routing**: React Router Dom

## Prerequisites

Make sure you have the following installed on your system:

- [Setup backend application first](https://github.com/Engarif3/restaurant-management)
- Adjust the backend **base api url** to your frontend application. (**very important**)

- **Option 1**: Run locally:

  - Node 18.18 installed.

- **Option 2**: Run with Docker:
  - Docker and Docker Compose installed on your system.

## Getting Started

### Running Locally

1. Clone the repository:

   ```bash
   git clone <Repo URL>
   cd <repository-folder>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the `.env` file with your credentials.

4. Run the application using the following command:

   ```bash
   npm run dev
   ```

5. Access the application locally:
   ```bash
   https://localhost:5173 or https://127.0.0.1:5173
   ```

### Running with Docker

1. Clone the repository:

   ```bash
   git clone <Repo URL>
   cd <repository-folder>
   ```

2. Start the application using Docker Compose:

   ```bash
   docker-compose up -d
   ```

3. Access the application locally:
   ```bash
   https://localhost:5173 or https://127.0.0.1:5173
   ```

## 📞 Contact

For any inquiries or issues, feel free to reach out:

- **Email:** [arif.aust.eng@gmail.com](mailto:arif.aust.eng@gmail.com)
- **LinkedIn:** [Md. Arifur Rahman](https://www.linkedin.com/in/engarif3/)
# SprachGenie-frontend
# E-Sprachgenie-new-frontend
