{
  description = "revanced-builder, A NodeJS ReVanced builder";

  inputs = {
    nixpkgs = { url = "github:NixOS/nixpkgs/nixpkgs-unstable"; };
    flake-utils = { url = "github:numtide/flake-utils"; };
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        inherit (nixpkgs.lib) optional;
        pkgs = import nixpkgs { inherit system; };

        adb = pkgs.androidenv.androidPkgs_9_0.platform-tools;
        jdk = pkgs.jdk;
        nodejs = pkgs.nodejs;
      in
      {
        devShell = pkgs.mkShell
          {
            buildInputs = [
              adb
              jdk
              nodejs
            ];
            shellHook = ''
              npm install
            '';
          };
      }
    );
}
