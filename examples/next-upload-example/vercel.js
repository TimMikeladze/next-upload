require('dotenv').config();

const { writeFileSync } = require('fs');

const config = {
  crons: [
    {
      path: `/cron?key=${process.env.CRON_KEY}`,
      schedule: '0 * * * *',
    },
  ],
};

writeFileSync('vercel.json', JSON.stringify(config));
