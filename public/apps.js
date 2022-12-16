ws.onopen = () => sendCommand({ event: 'getAppList' });
const apkField = document.getElementById('apkUpload');
function postFile() {
  const stat = document.createElement('h2');
  stat.className = 'stat';
  document.querySelector('header').appendChild(stat);
  // stackoverflow
  let formdata = new FormData();

  formdata.append('apk', apkField.files[0]);
  let request = new XMLHttpRequest();

  request.upload.addEventListener('progress', function (e) {
    let file1Size = apkField.files[0].size;

    if (e.loaded <= file1Size) {
      let percent = Math.round((e.loaded / file1Size) * 100);
      stat.innerHTML = `${percent + '%'} Uploading APK. Please wait.`;
    }

    if (e.loaded == e.total) {
      stat.innerHTML = `Upload Successful`;
    }
  });

  request.open('post', '/uploadApk');
  request.timeout = 45000;
  request.send(formdata);
}
apkField.addEventListener('change', () => {
  if (!apkField.value == '') {
    postFile();
    document.querySelector('ul').style.display = 'none';
    document.querySelector('.upl').style.display = 'none';
    const info = document.createElement('div');
    info.className = 'inf';
    info.innerHTML = '<h2>Please wait...</h2>';
    document.getElementById('content').appendChild(info);
  }
});
