WS_URI = `${window?.location?.protocol === 'https:' ? 'wss' : 'ws'}://${
  window?.location?.host ?? 'localhost:8080'
}`;
const ws = new WebSocket(WS_URI);

let currentFile;
let alreadyAddedLog = false;
let isDownloading = false;
let hasFinished = false;

function sendCommand(args) {
  ws.send(JSON.stringify(args));
}

function setApp() {
  if (!document.querySelector('input[name="app"]:checked')) {
    return alert("You didn't select an app to patch!");
  }
  sendCommand({
    event: 'selectApp',
    selectedApp: document.querySelector('input[name="app"]:checked').value
  });
  location.href = '/dependencies';
}

function loadPatches() {
  sendCommand({ event: 'getPatches' });
}

function updateFiles() {
  sendCommand({ event: 'updateFiles' });
}

function toggle(bool) {
  for (const checkbox of document.getElementsByClassName('select')) {
    checkbox.checked = bool;
  }
}

function goToPatches() {
  if (hasFinished) {
    location.href = '/patches';
  }
}

function setPatches() {
  const patchElementList = [...document.querySelectorAll('.select')];
  const selectedPatchElementList = patchElementList.filter(x => x.checked === true);
  
  if (selectedPatchElementList.length === 0) {
    return alert("You haven't selected any patches.");
  }

  const selectedPatchList = selectedPatchElementList.map(x => x.getAttribute("data-patch-name"));
  const excludedPatchList = patchElementList.filter(x => x.checked !== true).map(x => x.getAttribute("data-patch-name"));

  sendCommand({
    event: 'selectPatches',
    selectedPatches: selectedPatchList,
    excludedPatches: excludedPatchList
  });

  location.href = '/versions';
}

function setAppVersion() {
  if (!isDownloading) {
    if (!document.querySelector('input[name="version"]:checked')) {
      return alert("You didn't select an app version!");
    }
    sendCommand({
      event: 'selectAppVersion',
      versionChoosen: document.querySelector('input[name="version"]:checked')
        .value
    });

    document.getElementById('content').innerHTML = '<span class="log"></span>';
    document.getElementsByTagName('main')[0].innerHTML +=
      '<progress value="0"></progress>';
    isDownloading = true;
  } else {
    if (!hasFinished) return alert("Downloading process hasn't finished yet.");
    location.href = '/patch';
  }
}

function getAppVersions(isRooted) {
  document.getElementsByTagName('header')[0].innerHTML = `
    <h1>Select the version you want to download</h1>
    ${
      isRooted
        ? "<span><strong>You are building rooted ReVanced</strong>, you'll need to download the version matching with your YouTube version.<br>(You'll also need YouTube installed)<br>If you didn't intend on doing a rooted build, include all \"Root required to exclude\" patches<span>"
        : ''
    }
    `;
  const continueButtonn = document.getElementById('continue');
  const backButton = document.getElementById('back');
  continueButtonn.innerHTML = 'Continue';
  continueButtonn.onclick = () => setAppVersion();
  backButton.innerHTML = 'Back';
  backButton.onclick = () => history.back();
  sendCommand({ event: 'getAppVersion' });
}

function buildReVanced() {
  sendCommand({ event: 'patchApp' });
}

function getAlreadyExists() {
  sendCommand({ event: 'checkFileAlreadyExists' });
}
function openAbout() {
  window.open('/about', '_blank');
}

function openGitHub() {
  window.open('https://github.com/reisxd/revanced-builder', '_blank');
}

function toTitleCase(phrase) {
  return phrase
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

ws.onmessage = (msg) => {
  const message = JSON.parse(msg.data);
  switch (message.event) {
    case 'patchList': {
      for (let i = 0; i < message.patchList.length; i++) {
        const patch = message.patchList[i];
        document.getElementById('patchList').innerHTML += 
`<li>
  <input class="select" id="select-patch-${i}" data-patch-name="${patch.name}" type="checkbox">
  <label for="select-patch-${i}">
    <span style="float:right;"><strong>${patch.isRooted ? 'Needed for Non-Root Building' : ''}</strong></span>
    <span><strong>${toTitleCase(patch.name)}</strong></span>
    <span class="patch-description">${patch.description}</span>
  </label>
</li>`;
      }

      for (const patch of document.getElementsByClassName('select')) {
        if (message.rememberedPatchList.includes(patch.getAttribute("data-patch-name"))) {
          patch.checked = true;
        }
      }
      break;
    }

    case 'downloadingFile': {
      isDownloading = true;
      if (!document.getElementsByClassName('log')[0]) {
        document.getElementById('content').innerHTML =
          '<span class="log"></span>';
        document.getElementsByTagName('main')[0].innerHTML +=
          '<progress value="0"></progress>';
      }
      if (!currentFile) currentFile = message.name;
      if (currentFile === message.name) {
        if (!alreadyAddedLog) {
          document.getElementsByClassName(
            'log'
          )[0].innerHTML += `<span class="log-line"><strong>[builder]</strong> Downloading ${message.name}...</span><br/>`;
          alreadyAddedLog = true;
        }
        document.getElementsByTagName('progress')[0].value =
          '' + message.percentage / 100;
      } else {
        currentFile = message.name;
        document.getElementsByClassName(
          'log'
        )[0].innerHTML += `<span class="log-line"><strong>[builder]</strong> Downloading ${message.name}...</span><br/>`;
        document.getElementsByTagName('progress')[0].value =
          '' + message.percentage / 100;
      }
      break;
    }

    case 'finished': {
      hasFinished = true;
      document.getElementById('continue').classList.remove('disabled');
      document.getElementsByClassName('log')[0].innerHTML +=
        '<span class="log-line"><strong>[builder]</strong> Finished downloading files.</span><br/>';
      break;
    }

    case 'appVersions': {
      let i = 0;
      for (const version of message.versionList) {
        document.getElementById('versions').innerHTML += `
            <li>
            <input type="radio" name="version" id="app-${i}" value="${version.version}"/>
            <label for="app-${i}">${version.version}</label></li>`;
        i++;
      }
      break;
    }

    case 'patchLog': {
      document.getElementsByClassName(
        'log'
      )[0].innerHTML += `<span class="log-line${
        message.isStdErr ? ' stderr' : ''
      }"><strong>[builder]</strong> ${message.log}</span><br>`;
      break;
    }

    case 'fileExists': {
      // TODO: on a root install, if the file already exists and the user selects yes it skips checking if a device is plugged in
      document.getElementsByTagName('header')[0].innerHTML = `
            <h1>Use already downloaded APK?</h1>
            <span>The APK already exists in the revanced folder.${
              message.isRooted ? ' ' : '<br>'
            }Do you want to use it?${
        message.isRooted
          ? '<br>(Saying no is recommended for rooted building)<br>If you didn\'t intend on doing a rooted build, include all "Root required to exclude" patches'
          : ''
      }</span>`;

      const continueButtonn = document.getElementById('continue');
      const backButton = document.getElementById('back');
      continueButtonn.innerHTML = 'Yes';
      continueButtonn.onclick = () => (location.href = '/patch');
      backButton.innerHTML = 'No';
      backButton.onclick = () => getAppVersions(message.isRooted);
      break;
    }

    case 'fileDoesntExists': {
      getAppVersions(message.isRooted);
      break;
    }

    case 'buildFinished': {
      document.getElementsByTagName('header')[0].innerHTML =
        '<h1>ReVanced has been built.</h1>';
      document.getElementsByTagName('footer')[0].innerHTML +=
        '<button class="highlighted" onclick="window.open(\'/revanced.apk\', \'_blank\')">Download</button>' +
        '<button class="highlighted" onclick="location.href = \'/\'">Build Again</button>';
      break;
    }

    case 'error': {
      const failureURL = `/failure?error=${message.error}`;
      location.href = failureURL;
      break;
    }
  }
};
