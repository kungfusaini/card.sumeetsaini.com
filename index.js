const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname, {
  index: 'index.html',
  extensions: ['html']
}));


// Serve vCard for download
app.get('/vcard', (req, res) => {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Sumeet Saini',
    'TITLE:Full Stack Developer & Designer',
    'ORG:Reliq Digital',
    'URL:https://sumeetsaini.com',
    'URL:https://reliq.digital',
    'URL:https://www.linkedin.com/in/sumeet-saini-com/',
    'EMAIL:hi@sumeetsaini.com',
    'END:VCARD'
  ].join('\r\n');

  res.set({
    'Content-Type': 'text/vcard; charset=utf-8',
    'Content-Disposition': 'attachment; filename="Sumeet-Saini.vcf"'
  });
  res.send(vcard);
});

// Any path redirects to root
app.use((req, res) => {
  if (req.path !== '/') {
    res.redirect('/');
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Card server running on port ${PORT}`);
});