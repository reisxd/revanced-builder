/* eslint-disable no-unused-vars */

const WS_URI = `${window?.location?.protocol === 'https:' ? 'wss' : 'ws'}://${
  window?.location?.host ?? 'localhost:8080'
}`;
const ws = new WebSocket(WS_URI);

let currentFile;
let alreadyAddedLog = false;
let isDownloading = false;
let hasFinished = false;
let arch;
let versionChoosen;

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

function checkForUpdates() {
  sendCommand({ event: 'checkForUpdates' });
}

function setPatches() {
  const patchElementList = [...document.querySelectorAll('.select')];
  const selectedPatchElementList = patchElementList.filter(
    (x) => x.checked === true
  );

  if (selectedPatchElementList.length === 0) {
    return alert("You haven't selected any patches.");
  }

  const selectedPatchList = selectedPatchElementList.map((x) =>
    x.getAttribute('data-patch-name')
  );
  const excludedPatchList = patchElementList
    .filter((x) => x.checked !== true)
    .map((x) => x.getAttribute('data-patch-name'));

  sendCommand({
    event: 'selectPatches',
    selectedPatches: selectedPatchList,
    excludedPatches: excludedPatchList
  });

  location.href = '/versions';
}

function setAppVersion(arch, version) {
  if (!isDownloading) {
    if (!arch) {
      if (!document.querySelector('input[name="version"]:checked')) {
        return alert("You didn't select an app version!");
      }
    }

    sendCommand({
      event: 'selectAppVersion',
      versionChoosen:
        version ||
        document.querySelector('input[name="version"]:checked').value,
      arch
    });

    document.getElementsByTagName('header')[0].innerHTML =
      '<h1>Downloading APK...</h1>';
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
    Versions marked as beta might have bugs or be unstable, unless marked as recommended
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

function exitApp() {
  sendCommand({ event: 'exit' });
  const tempW = window.open(location, '_self');
  tempW.close();
  return false;
}

window.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();

    document.getElementById('continue').click();
  }
});

ws.onmessage = (msg) => {
  const message = JSON.parse(msg.data);
  switch (message.event) {
    case 'patchList': {
      console.log(message);
      for (let i = 0; i < message.patchList.length; i++) {
        const patch = message.patchList[i];
        document.getElementById('patchList').innerHTML += `<li>
  <input class="select" id="select-patch-${i}" data-patch-name="${
          patch.name
        }" type="checkbox">
  <label for="select-patch-${i}">
    <span style="float:right;"><strong>${
      patch.isRooted ? 'Needed for Non-Root Building' : ''
    }</strong></span>
    <span><strong>${toTitleCase(patch.name)}</strong>&nbsp;&nbsp;(${
          patch.maxVersion !== ' ' ? patch.maxVersion : 'ALL'
        })</span>
    <span class="patch-description">${patch.description}</span>
  </label>
</li>`;
      }

      for (const patch of document.getElementsByClassName('select')) {
        if (
          message.rememberedPatchList.includes(
            patch.getAttribute('data-patch-name')
          )
        ) {
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
            <input type="radio" name="version" id="app-${i}" value="${
          version.version
        }"/>
            <label for="app-${i}">${version.version} ${
          version.beta ? ' (beta)' : ''
        } ${version.recommended ? ' (recommended)' : ''}</label></li>`;
        i++;
      }

      if (message.selectedApp === 'music' && !message.foundDevice) {
        document.getElementById('continue').onclick = () => {
          const version = document.querySelector(
            'input[name="version"]:checked'
          ).value;
          document.getElementsByTagName('header')[0].innerHTML = `
          <h1>Please select the architecture</h1>
          <span>YouTube Music APKs only have specific architecture APKs.
          <br>If you don't know which one to choose, either look at your devices architecture using CPU-Z or select Arm64.</span>`;
          document.getElementById('versions').innerHTML = '';
          document.getElementById('versions').innerHTML += `
          <li>
          <input type="radio" name="arch" id="arch-1" value="arm64-v8a"/>
          <label for="arch-1">Arm64 (armv8)</label></li>
          <li>
          <input type="radio" name="arch" id="arch-2" value="armeabi-v7a"/>
          <label for="arch-2">Arm32 (armv7)</label></li>`;
          document.getElementById('continue').onclick = () => {
            if (isDownloading && hasFinished) {
              location.href = '/patch';
            }
            setAppVersion(
              document.querySelector('input[name="arch"]:checked').value,
              version
            );
          };
        };
      }
      break;
    }

    case 'patchLog': {
      let logLevel;
      if (message.log.includes('WARNING')) {
        logLevel = 'warn';
      } else if (message.log.includes('SEVERE')) {
        logLevel = 'error';
      }

      document.getElementsByClassName(
        'log'
      )[0].innerHTML += `<span class="log-line ${logLevel}"><strong>[builder]</strong> ${message.log}</span><br>`;
      const logWrap = document.getElementById('content--wrapper');
      logWrap.scrollTop = logWrap.scrollHeight;
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
      if (!WS_URI.startsWith('ws://localhost')) {
        document.getElementsByTagName('footer')[0].innerHTML +=
          '<button class="highlighted" onclick="window.open(\'/revanced.apk\', \'_blank\')">Download</button>';
      }
      document.getElementsByTagName('footer')[0].innerHTML +=
        '<button class="highlighted" onclick="location.href = \'/\'">Build Again</button>';
      document.getElementsByTagName('footer')[0].innerHTML +=
        '<button onclick="exitApp();">Quit</button>';
      break;
    }

    case 'error': {
      const failureURL = `/failure?error=${message.error}`;
      location.href = failureURL;
      break;
    }

    case 'notUpToDate': {
      document.getElementById('container').innerHTML += `
      <dialog>
      <span>Your current version of Builder is not up to date.<br>Do you want to update to ${message.builderVersion}?</span>
      <div class="buttonContainer"><button class="highlighted" onclick="window.open('https://github.com/reisxd/revanced-builder/releases/latest', '_blank'); document.getElementById('container').removeChild(document.getElementsByTagName('dialog')[0]);">Yes</button> <button onclick="document.getElementById('container').removeChild(document.getElementsByTagName('dialog')[0]);">No</button></div></dialog>`;
    }
  }
};
