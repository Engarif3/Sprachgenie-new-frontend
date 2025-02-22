# Use the official Node.js image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire React app to the container
COPY . .

# Build the React app for production
RUN npm run build

# Expose the port that the app runs on
EXPOSE 5173

# Serve the production build
CMD ["npx", "vite", "preview", "--host", "0.0.0.0"]


