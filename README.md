# Backend of Staking Dapp

This is backend side of staking Dapp made using hardhat.

Run:

```shell
npm install
 npx hardhat test
 npx hardhat node
```

NOTE--
while installing node modules using "npm install" you might get an error, so first install hardhat package separately as it is not the part of package.json
STEPS ARE-

```
1. npm install hardhat
2. npm install
```

Then install
`hardhat-deploy-ethers`
Since hardhat-deploy-ethers is a fork of @nomiclabs/hardhat-ethers and that other plugin might have an hardcoded dependency on @nomiclabs/hardhat-ethers the best way to install hardhat-deploy-ethers and ensure compatibility is the following:
`npm install --save-dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers`

To run localhost server on hardhat -`npx hardhat node`
