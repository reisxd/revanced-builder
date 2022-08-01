export default async function (message, ws) {
  for (const patch of message.selectedPatches) {
    const patchName = patch.replace(/\|.+(.*)$/, '').replace(/\s/g, '');
    global.jarNames.patches += ` -i ${patchName}`;
  }
}
