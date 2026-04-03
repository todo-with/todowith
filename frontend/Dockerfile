FROM node:22-alpine

WORKDIR /app

# Enable corepack and use npm (since Next.js setup used npm here)
# Copy package installation files
COPY package.json package-lock.json ./

RUN npm install

# Copy all other project files
COPY . .

# Expose port (default Next.js)
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
