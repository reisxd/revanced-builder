const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');

const actualExec = promisify(exec);

module.exports =  async function (pkg, ws) {
  // Copy ReVanced APK to temp.
  await actualExec(
    'su -c \'cp "revanced/revanced.apk" "/data/local/tmp/revanced.delete"\''
  );
  // Create folder
  await actualExec('su -c \'mkdir -p "/data/adb/revanced/"\'');
  // Move APK to folder
  await actualExec(
    `su -c 'base_path="/data/adb/revanced/${pkg}.apk" && mv "/data/local/tmp/revanced.delete" "$base_path" && chmod 644 "$base_path" && chown system:system "$base_path" && chcon u:object_r:apk_data_file:s0  "$base_path"'`
  );
  // Create Mount script
  fs.writeFileSync(
    './mount.sh',
    `#!/system/bin/sh
    while [ "$(getprop sys.boot_completed | tr -d '\r')" != "1" ]; do sleep 1; done

    base_path="/data/adb/revanced/${pkg}.apk"
    stock_path=$( pm path ${pkg} | grep base | sed 's/package://g' )
    chcon u:object_r:apk_data_file:s0  $base_path
    mount -o bind $base_path $stock_path`
  );
  // Move Mount script to folder
  await actualExec(
    `su -c 'cp "./mount.sh" "/data/adb/service.d/mount_revanced_${pkg}.sh"'`
  );
  // Give execution perms to Mount script
  await actualExec(
    `su -c 'chmod +x "/data/adb/service.d/mount_revanced_${pkg}.sh"'`
  );

  // Unmount APK
  // await actualExec(
  //  `su -c 'stock_path="$( pm path ${pkg} | grep base | sed 's/package://g' )" && umount -l "$stock_path"'`
  // );

  // Run Mount script
  await actualExec(`su -c '"/data/adb/service.d/mount_revanced_${pkg}.sh"'`);
  // Kill mounted process
  // await actualExec(`su -c 'monkey -p ${pkg} 1 && kill $(pidof -s ${pkg})'`);

  ws.send(
    JSON.stringify({
      event: 'patchLog',
      log: 'ReVanced should be now mounted! Please restart the device and check if the app has been mounted.'
    })
  );
}
