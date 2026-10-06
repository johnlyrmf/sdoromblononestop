const fs = require('fs');
const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');

const keyfilePath = process.argv[2];
const scopes = ['https://www.googleapis.com/auth/gmail.send'];
const outputPath = path.join(__dirname, 'gmail-refresh-token.txt');

if (!keyfilePath) {
  console.error('Usage: node scripts/authorize-gmail.js "C:\\path\\to\\oauth-client.json"');
  process.exit(1);
}

(async () => {
  const auth = await authenticate({ keyfilePath, scopes });
  const refreshToken = auth.credentials.refresh_token;
  if (!refreshToken) throw new Error('Google did not return a refresh token. Try authorizing again and approve offline access.');
  fs.writeFileSync(outputPath, `${refreshToken}\n`, { encoding: 'utf8' });
  console.log(`Refresh token saved locally to: ${outputPath}`);
  console.log('Do not upload or paste this file. Store it in Firebase Secret Manager next.');
})().catch((error) => {
  console.error(error.message || 'Gmail authorization failed.');
  process.exit(1);
});
