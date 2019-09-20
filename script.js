var usernameInput = document.querySelector('#usernameInput');
var channelInput = document.querySelector('#channelInput');
var submitBtn = document.querySelector('.submit-btn');
var submitBtnText = document.querySelector('.btn-text');
var loadingElement = document.querySelector('.loader');

var urlParams = new URLSearchParams(window.location.search);
usernameInput.value = urlParams.get('u');
channelInput.value = urlParams.get('c');

usernameInput.addEventListener('input', validateForm);
channelInput.addEventListener('input', validateForm);

validateForm();

function getLocation() {
  loadingElement.style.display = 'block';
  submitBtnText.style.opacity = 0;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(reverseGeocode);
  } else {
    x.innerHTML = 'Geolocation is not supported by this browser.';
  }
}

function reverseGeocode(position) {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  var url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${config.mapBoxToken}`
  axios.get(url)
    .then(function(resp) {
      postToSlack(lat, lng, resp.data.features[1].place_name)
    })
    .catch(function(err) {
      loadingElement.style.display = 'none';
      submitBtnText.style.opacity = 100;
      console.log('failed reverse geocode', err)
    })
}

function postToSlack(lat, lng, address) {
  var payload = {
    channel: channelInput.value,
    blocks: [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `The current location of ${usernameInput.value}: \n https://www.google.com/maps/@${lat},${lng},16z`
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
        "alt_text": `The current location of ${usernameInput.value}`
      }
    ]
  }

  axios.post(config.slackWebhookURL, JSON.stringify(payload))
    .then(function () {
      loadingElement.style.display = 'none';
      submitBtnText.style.opacity = 100;
    })
    .catch(function (err) {
      loadingElement.style.display = 'none';
      submitBtnText.style.opacity = 100;
      console.log('failed posting to slack', err);
    })
}

function validateForm() {
  submitBtnText.innerHTML = `Post in #${channelInput.value}`;

  if (usernameInput.value && channelInput.value) {
    submitBtn.classList.remove('disabled');
    submitBtn.addEventListener('click', getLocation);
  } else {
    submitBtn.classList.add('disabled');
    submitBtn.removeEventListener('click', getLocation);
  }
}