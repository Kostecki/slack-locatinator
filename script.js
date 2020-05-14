var alertElement = document.getElementById('status-alert');
var alertElementContent = document.querySelector('#status-alert .content');
var usernameInput = document.querySelector('#usernameInput');
var channelInput = document.querySelector('#channelInput');
var submitBtn = document.querySelector('.submit-btn');
var submitBtnText = document.querySelector('.btn-text');
var loadingElement = document.querySelector('.loader');

var url = new URLSearchParams(window.location.search);
var username = url.get('user');
var channel = url.get('channel');

usernameInput.value = username;
channelInput.value = channel;
submitBtnText.innerHTML += channel;

usernameInput.addEventListener('input', validateForm);
channelInput.addEventListener('input', validateForm);
alertElement.addEventListener('click', clearAlert)

let autoEnabled = (url.get('auto') == 'true');
if (autoEnabled) {
  getLocation();
} else {
  validateForm(); 
}

function getLocation() {
  loadingElement.style.display = 'block';
  submitBtnText.style.opacity = 0;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(reverseGeocode);
  } else {
    loadingElement.style.display = 'none';
    submitBtnText.style.opacity = 100;
    setAlert('danger', 'Geolocation is not supported by this browser');
  }
}

function reverseGeocode(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${config.mapBoxToken}`
  axios.get(url)
    .then(function(resp) {
      sendToSlack(lat, lng, resp.data.features[1].place_name)
    })
    .catch(function(err) {
      loadingElement.style.display = 'none';
      submitBtnText.style.opacity = 100;
      setAlert('danger', `Failed doing reverse geocode: <span class="alert-link">${err}</span>`);
    })
}

function sendToSlack(lat, lng, address) {
  var blocks = [
    {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `The current location of ${username}: \n http://maps.google.com/maps?&z=16&q=${lat}+${lng}&ll=${lat}+${lng}`
        }
      },
      {
        "type": "image",
        "title": {
          "type": "plain_text",
          "text": address || 'Current location',
          "emoji": true
        },
        "image_url": `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-marker+285A98(${lng},${lat})/${lng},${lat},13,0/600x300?access_token=${config.mapBoxToken}&attribution=false&logo=false`,
        "alt_text": `The current location of ${username}`
      }
  ]
  
  axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded';
  axios.get('https://slack.com/api/chat.postMessage', {
    params: {
      token: config.slackOAuthToken,
      channel: channel,
      blocks: JSON.stringify(blocks),
      unfurl_links: true,
      unfurl_media: true,
      as_user: false
    }
  })
  .then(function (res) {
    loadingElement.style.display = 'none';
    submitBtnText.style.opacity = 100;

    if (!res.data.ok) {
      setAlert('danger', `Error posting to slack: <span class="alert-link">${res.data.error}</span>`);
    } else {
      setAlert('success', `Succesfully posted location to <span class="alert-link">#${channel}</span!`);
    }
  })
  .catch(function (err) {
    loadingElement.style.display = 'none';
    submitBtnText.style.opacity = 100;
    setAlert('danger', `Error posting to slack: <span class="alert-link">${err}</span>`);
  })
}

function validateForm() {
  username = usernameInput.value;
  channel = channelInput.value;

  submitBtnText.innerHTML = `Post in #${channel}`;

  if (username && channel) {
    submitBtn.classList.remove('disabled');
    submitBtn.addEventListener('click', getLocation);
  } else {
    submitBtn.classList.add('disabled');
    submitBtn.removeEventListener('click', getLocation);
  }
}

function setAlert(type, msg) {
  alertElementContent.innerHTML = msg;
  alertElement.className = `alert alert-${type}`;
  alertElement.style.display = 'block';
}

function clearAlert() {
  alertElementContent.innerHTML = '';
  alertElement.className = 'alert';
  alertElement.style.display = 'none';
}