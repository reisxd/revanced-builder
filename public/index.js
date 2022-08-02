const ws = new WebSocket('ws://localhost:8080');

let currentFile;
let alreadyAddedLog = false;
let hasFinished = false
let isDownloading = false;

function sendCommand(args) {
    ws.send(JSON.stringify(args));
}

function setApp() {
    if (!document.querySelector('input[name="app"]:checked')) return alert('You didn\'t select an app to patch!');
    sendCommand({ event: 'selectApp', selectedApp: document.querySelector('input[name="app"]:checked').value });
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
    if (!hasFinished) return alert('Downloading process hasn\'t finished yet.');
    else location.href = '/patches'
}

function setPatches() {
    const data = [...document.querySelectorAll('.select:checked')].map(e => e.attributes.patchName.nodeValue);
    if (data.length = 0) return alert('You haven\'t selected any patches.');

    sendCommand({ event: 'selectPatches', selectedPatches: data });

}

function setAppVersion() {
    if (!isDownloading) {
    if (!document.querySelector('input[name="version"]:checked')) return alert('You didn\'t select an app version!');
    sendCommand({ event: 'selectAppVersion', versionChoosen: document.querySelector('input[name="version"]:checked').value });

    document.getElementById('content').innerHTML = `<span class="log"></span>`;
    document.getElementsByTagName('main')[0].innerHTML += `<progress value="0"></progress>`;
    isDownloading = true;
    } else {
        if (!hasFinished) return alert('Downloading process hasn\'t finished yet.');
        location.href = '/patch';
    }
}

function getAppVersions() {
    sendCommand({ event: 'getAppVersion' });
}

function buildReVanced() {
    sendCommand({ event: 'patchApp' });
}

function openAbout() {
    window.open('http://localhost:8080/about', "_blank");
}

function openGitHub() {
    window.open('https://github.com/reisxd/revanced-builder', "_blank");
}

ws.onmessage = (msg) => {
    const message = JSON.parse(msg.data);
    switch (message.event) {
        case 'patchList': {
            let i = 1;
            for (const patch of message.patchList) {
                document.getElementById('patchList').innerHTML += `
                <li>
							<input class="select" id="select-patch-${i}" type="checkbox" patchName="${patch.name}">
							<label for="select-patch-${i}">
								<span style="float:right;"><strong>${patch.isRooted ? 'Requires root to be excluded' : ''}</strong></span>
								<input class="dropdown" id="dropdown-patch-${i}" type="checkbox">
								<label for="dropdown-patch-${i}">
									<i class="fa-solid fa-lg fa-caret-down"></i>
									<span><strong>${patch.name}</strong></span>
									<div class="dropdown-content">
										<span>${patch.description}</span>
									</div>
								</label>
							</label>
						</li>`;
                i++;
            }
            break;
        }

        case 'downloadingFile': {
            if (!currentFile) currentFile = message.name;
            if (currentFile === message.name) {
                if (!alreadyAddedLog) {
                    document.getElementsByClassName('log')[0].innerHTML += `<strong>[builder]</strong> Downloading ${message.name}...<br>`;
                    alreadyAddedLog = true;
                }
                document.getElementsByTagName('progress')[0].value = '0.' + ('0' + message.percentage).slice(-2);
            } else {
                currentFile = message.name;
                document.getElementsByClassName('log')[0].innerHTML += `<strong>[builder]</strong> Downloading ${message.name}...<br>`;
                document.getElementsByTagName('progress')[0].value = '0.' + ('0' + message.percentage).slice(-2);
            }
            break;
        }

        case 'finished': {
            hasFinished = true;
            document.getElementsByClassName('log')[0].innerHTML += '<strong>[builder]</strong> Finished downloading files<br>';
            break;
        }

        case 'appVersions': {
            for (const version of message.versionList) {
                document.getElementById('versions').innerHTML += `
            <li>
            <input type="radio" name="version" id="app-1" value="${version.version}"/>
            <label for="app-1">${version.version}</label></li>`;
            }
            break;
        }

        case 'patchLog': {
            document.getElementsByClassName('log')[0].innerHTML += `<strong>[builder]</strong> ${message.log}<br>`
            document.getElementsByClassName('log')[0].scrollBy(0, 20);
            break;
        }
    }
}