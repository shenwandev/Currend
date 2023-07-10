const express = require('express');
const app = express();
const session = require('express-session');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'test',
  resave: false,
  saveUninitialized: false
}));

const client_id = '1101474022346199080';
const client_secret = 'OOznmJI4pz2DYAzOHU1VsmB_WCaxewQ4';
const redirect_uri = 'http://localhost:3000/process-oauth';

app.get('/signup', (req, res) => {
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=identify%20guilds%20email`;
  res.redirect(discordUrl);
});

app.get('/process-oauth', async (req, res) => {
  if (!req.query.code) {
    res.send('no code');
    return;
  }

  const discord_code = req.query.code;

  const payload = {
    code: discord_code,
    client_id: client_id,
    client_secret: client_secret,
    grant_type: 'authorization_code',
    redirect_uri: redirect_uri,
    scope: 'identify guilds email',
  };

  const tokenUrl = 'https://discordapp.com/api/oauth2/token';

  try {
    const response = await axios.post(tokenUrl, querystring.stringify(payload), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = response.data;

    const userUrl = 'https://discordapp.com/api/users/@me';
    const headers = {
      Authorization: `Bearer ${access_token}`,
    };

    const userResponse = await axios.get(userUrl, { headers });
    //console.log(userResponse)
    const userData = {
      id: userResponse.data.username,
      name: userResponse.data.global_name,
      discord_id: userResponse.data.id,
      avatar: userResponse.data.avatar,
      email: userResponse.data.email,
    };

    req.session.logged_in = true;
    req.session.userData = userData;

    res.redirect('/diset');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred.');
  }
});


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/sign-up', (req, res) => {
    res.render('sign-up');
});

app.get('/diset', (req, res) => {
  const userData = req.session.userData || {};
  res.render('diset', { userData });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
