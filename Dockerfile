# Use node 8.11.3 LTS
FROM node:8.11.3

# Copy source code
COPY . /app

# Change working directory
WORKDIR /app

# Install dependencies
RUN npm install

# Expose API port to the outside
EXPOSE 8080

# Launch application
#CMD ["npm","start"]

CMD ["node","app.js"]