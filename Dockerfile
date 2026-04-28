FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN npm init -y && npm install express google-auth-library googleapis cors

# Copy app files
COPY index.js ./
COPY index.html ./
COPY face.jpg ./
COPY ProFontIIx-subset.woff2 ./
COPY favicon.png ./

# Expose port
EXPOSE 3000

CMD ["node", "index.js"]