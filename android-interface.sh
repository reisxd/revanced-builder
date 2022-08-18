#!/bin/bash

SCR_NAME_EXEC=$0
SCR_NAME=$(basename $SCR_NAME_EXEC)

help_info () {
  cat <<EOF
Usage: $SCR_NAME [command] [options]

Commands:
  run                 Launches the revanced-builder.
                      Running $SCR_NAME_EXEC without arguments will
                      assume this command (i.e. will run the
                      builder).
    --delete-cache    Deletes revanced/ before building.

  reinstall           Delete everything and start from scratch.
    --delete-keystore Delete the signature file also. This will
                      make ReVanced use a different signature,
                      which will not allow you to install an
                      updated build over the previously installed
                      one (you'll need to uninstall that first).

  update              Update the builder to the latest version.

  help                Show this help info.
EOF
}

log () {
  echo "[$SCR_NAME] $1"
}

dload_and_install () {
  log "Downloading revanced-builder..."
  curl -sLo revanced-builder.zip https://github.com/reisxd/revanced-builder/archive/refs/heads/main.zip
  log "Unzipping..."
  unzip -qqo revanced-builder.zip
  rm revanced-builder.zip
  mv revanced-builder{-main,}
  cd revanced-builder
  log "Installing packages..."
  npm install --omit=dev
  [[ -z $1 ]] && log "Done. Execute \`$SCR_NAME_EXEC run\` to launch the builder."
}

run_builder () {
  if [[ ! -d $HOME/revanced-builder ]]; then
    log "Installing revanced-builder..."
    if [[ ! -d $HOME/storage ]]; then
      log "You will now get a permission dialog to allow access to storage."
      log "This is needed in order to move the built APK (+ MicroG) to Internal Storage."
      sleep 5
      termux-setup-storage
    fi
    log "Updating Termux and installing dependencies..."
    pkg update -y
    pkg install nodejs-lts openjdk-17 -y
    dload_and_install n
  fi
  [[ $1 == "--delete-cache" ]] && rm -rf $HOME/revanced-builder/revanced
  cd $HOME/revanced-builder
  node .
}

reinstall_builder () {
  log "Deleting revanced-builder..."
  cd $HOME/revanced-builder
  if [[ $2 != "--delete-keystore" ]]; then
    EXCLUDE_KEYSTORE="! -name 'revanced/revanced.keystore'"
    log "Preserving the keystore. If you do not want this, use the --delete-keystore flag."
    log "Execute \`$SCR_NAME_EXEC help\` for more info."
  fi
  find . $EXCLUDE_KEYSTORE -exec rm -rf {} +
  dload_and_install
}

update_builder () {
  log "Updating revanced-builder..."
  cd $HOME/revanced-builder
  dload_and_install
}

main () {
  error () {
    log "$1"
    help_info
    exit 1
  }
  if [[ -z "$@" ]]; then
    run_builder
  elif [[ $# -gt 2 ]]; then
    error "2 optional arguments acceptable, got $#."
  else
    case $1 in
      run)
        run_builder $2
      ;;
      reinstall)
        reinstall_builder $2
      ;;
      update)
        update_builder
      ;;
      help)
        help_info
      ;;
      *)
        error "Invalid argument(s): $@."
      ;;
    esac
  fi
}

main $@
