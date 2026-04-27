FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY face.jpg /usr/share/nginx/html/
COPY ProFontIIx-subset.woff2 /usr/share/nginx/html/
COPY favicon.png /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]