const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname, {
  index: 'index.html',
  extensions: ['html']
}));

let credentials;
try {
  credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf8'));
} catch (e) {
  console.log('No credentials found - wallet will be disabled');
}

// Google Wallet configuration - TEST issuer (works without verification)
const ISSUER_ID = '3388000000000000000';
const PASS_CLASS_ID = 'SumeetBusinessCard';

// Properly sign JWT with the service account private key
function createSignedJwt() {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials ? credentials.private_key_id : 'test-key-id'
  };
  
  const payload = {
    iss: credentials.client_email,
    aud: 'google',
    typ: 'google/wallet/objects/v1genericobject',
    payload: {
      genericClasses: [{
        id: `${ISSUER_ID}.${PASS_CLASS_ID}`
      }],
      genericObjects: [{
        id: `${ISSUER_ID}.sumeet.saini.${Date.now()}`,
        classId: `${ISSUER_ID}.${PASS_CLASS_ID}`,
        state: 'ACTIVE',
        cardTitle: {
          defaultValue: {
            language: 'en-US',
            value: 'Sumeet Saini'
          }
        },
        header: {
          defaultValue: {
            language: 'en-US',
            value: 'AI & Full Stack Developer'
          }
        },
        subheader: {
          defaultValue: {
            language: 'en-US',
            value: 'card.sumeetsaini.com'
          }
        }
      }]
    },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  // Create JWT parts
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signedContent = `${headerB64}.${payloadB64}`;
  
  // Sign with private key
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signedContent);
  const signature = sign.sign(credentials.private_key, 'base64url');
  
  return `${signedContent}.${signature}`;
}

// Create pass class (if not exists)
async function ensureClassExists() {
  const classId = `${ISSUER_ID}.${CLASS_ID}`;
  
  try {
    const response = await wallet.loyaltyclass.get({ classId });
    console.log('Class already exists:', classId);
    return classId;
  } catch (e) {
    console.log('Class not found, creating...', e.message);
    
    // Class doesn't exist, create it
    const newClass = {
      id: classId,
      className: 'SumeetSainiBusinessCard',
      issuerName: 'Sumeet Saini',
      reviewStatus: 'DRAFT', // Use DRAFT to avoid needing verification
      hexBackgroundColor: '1d2021',
      logo: {
        sourceUri: {
          uri: 'https://card.sumeetsaini.com/favicon.png'
        }
      },
      cardTitle: {
        defaultValue: {
          language: 'en-US',
          value: 'Business Card'
        }
      }
    };
    
    try {
      const response = await wallet.loyaltyclass.insert({ requestBody: newClass });
      console.log('Class created:', classId);
      return classId;
    } catch (createError) {
      console.error('Error creating class:', createError.message);
      throw createError;
    }
  }
}

// Generate signed JWT for Google Wallet
function createJwt(classId, objectId) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials ? credentials.private_key_id : 'test'
  };
  
  const payload = {
    iss: credentials ? credentials.client_email : 'test@test.com',
    aud: 'google',
    typ: 'google/wallet/objects/v1genericobject',
    payload: {
      genericClasses: [{
        id: classId
      }],
      genericObjects: [{
        id: objectId,
        classId: classId,
        state: 'ACTIVE',
        cardTitle: {
          defaultValue: {
            language: 'en-US',
            value: 'Sumeet Saini'
          }
        },
        header: {
          defaultValue: {
            language: 'en-US',
            value: 'AI & Full Stack Developer'
          }
        },
        subheader: {
          defaultValue: {
            language: 'en-US',
            value: 'card.sumeetsaini.com'
          }
        },
        linksModuleData: {
          uris: [
            {
              uri: 'https://card.sumeetsaini.com',
              description: 'View Digital Card'
            },
            {
              uri: 'mailto:hi@sumeetsaini.com',
              description: 'Email Me'
            },
            {
              uri: 'https://www.linkedin.com/in/sumeet-saini-com/',
              description: 'LinkedIn'
            },
            {
              uri: 'https://github.com/kungfusaini',
              description: 'GitHub'
            },
            {
              uri: 'https://reliq.digital',
              description: 'Freelance Work'
            }
          ]
        }
      }]
    },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  return { header, payload };
}

// API endpoint to create wallet pass
app.post('/api/wallet/create-pass', (req, res) => {
  if (!credentials) {
    return res.status(500).json({ error: 'Wallet credentials not configured' });
  }
  
  try {
    // Create properly signed JWT
    const jwtToken = createSignedJwt();
    
    const addToWalletUrl = `https://pay.google.com/gp/v/save/${jwtToken}`;
    
    res.json({ 
      success: true, 
      url: addToWalletUrl
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', wallet: !!credentials });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Card server running on port ${PORT}`);
  if (credentials) {
    console.log('Wallet credentials loaded - Google Wallet enabled');
  } else {
    console.log('No wallet credentials - wallet disabled');
  }
});