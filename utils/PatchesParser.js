const fetchURL = require('node-fetch');

module.exports = async (packageName, hasRoot) => {
    const patchesRequest = await fetchURL('https://cors-shrihan.herokuapp.com/https://raw.githubusercontent.com/revanced/revanced-patches/main/patches.json ',
    {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
            'sec-ch-ua': '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua-mobile': '?0',
            'origin': 'https://github.com'
        }
    });
    const patchesJSON = await patchesRequest.json();

    const rootedPatches = [
        'microg-support',
        'hide-cast-button',
        'music-microg-support'
      ];

    const patches = [];

    global.versions = [];

    for (const patch of patchesJSON) {
        const isRooted = rootedPatches.includes(patch.name);

        // Check if the patch is compatible:
        let isCompatible = false;
        let compatibleVersion;
        for (const package of patch.compatiblePackages) {
            if (package.name.endsWith(packageName)) {
                isCompatible = true;
                console.log(package.versions)
                if (package.versions.length !== 0) {
                    compatibleVersion = package.versions[package.versions.length - 1];
                    global.versions.push(compatibleVersion);
                }
            }
        }

        if (!isCompatible) {
            continue;
        }
        if (isRooted || !hasRoot) {
            continue;
        }

        patches.push({
            name: patch.name,
            description: patch.description,
            maxVersion: compatibleVersion,
            isRooted
        });
    }

    return patches;
}