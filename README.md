# dapphomes-sensors

Virtual DappHomes sensors:

* Fetching data from [OpenWeather](https://openweathermap.org/).
* Encrypt data using [taco-web](https://github.com/nucypher/taco-web).
* Pin encrypted data to [IPFS](https://ipfs.tech/) using [Pinata API](https://www.pinata.cloud/).

* ## test

1. Install [docker](https://docs.docker.com/engine/install/) within the preferred operating system.
2. Open vscode and install [remote development plugin](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) typing `Ctrl + P` and pasting `ext install ms-vscode-remote.vscode-remote-extensionpack`.
3. Clone this repository:
```
git clone git@github.com:hardenerdev/dapphomes-sensors.git
```
4. Open directory in container using `Ctrl + P`, choose `Dev Containers: Open Folder in Container...` and open repository folder.
5. Create and edit `.env` from `.env.template`.
6. Open a terminal inside vscode (``Ctrl + Shift + ` ``) and execute hardhat commands

```bash
npm start
```
