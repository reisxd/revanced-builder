/* global ws, sendCommand */

ws.onopen = () => sendCommand({ event: 'getAppList' });
const apkField = document.getElementById('apkUpload');
apkField.addEventListener('change', () => {
  if (!apkField.value == '') {
    postFile();
    const info = document.createElement('div');
    info.className = 'inf';
    info.innerHTML = '<h2>Please wait...</h2>';
    document.getElementById('content').appendChild(info);
  }
});
function postFile() {
  document.querySelector('ul').style.display = 'none';
  document.querySelector('.upl').style.display = 'none';
  document.querySelector('#search').style.display = 'none';
  document.querySelector('h1').style.display = 'none';
  const stat = document.querySelector('.prog');
  stat.style.display = 'block';
  // stackoverflow
  let formdata = new FormData();

  formdata.append('apk', apkField.files[0]);
  let request = new XMLHttpRequest();

  request.upload.addEventListener('progress', function (e) {
    let file1Size = apkField.files[0].size;

    if (e.loaded <= file1Size) {
      let percent = Math.round((e.loaded / file1Size) * 100);
      stat.innerHTML = `${percent + '%'} Uploading APK...`;
    }

    if (e.loaded == e.total) {
      stat.innerHTML = `Upload Successful`;
    }
  });

  request.open('post', '/uploadApk');
  request.timeout = 60 * 10 * 1000;
  request.send(formdata);
}

// eslint-disable-next-line no-unused-vars
function oldState(e) {
  e.style.display = 'none';
  document.querySelector('ul').style.display = 'block';
  document.querySelector('h1').style.display = 'block';
  document.querySelector('.prog').style.display = 'none';
  document.querySelector('#search').style.display = null;
  document.querySelector('.upl').style.display = 'inline-flex';
  document.querySelector('.inf').remove();
  document.getElementById('continue').setAttribute('onClick', 'setApp()');
  document.getElementById('uploadForm').reset();
}
