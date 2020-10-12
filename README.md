# gov-contracts
Bancor Governance contracts

## Installation

- `yarn`
- `yarn build`

## Test

- `ganache-cli &`
- `yarn test`

## Migration

- `yarn migrate`

## Networks

### Ethereum Mainnet

| Contract             | Address                                      | Comment                              |
|----------------------|----------------------------------------------|--------------------------------------|
| BancorGovernance     | [`0x892f481bd6e9d7d26ae365211d9b45175d5d00e4`](https://etherscan.io/address/0x892f481bd6e9d7d26ae365211d9b45175d5d00e4) | Bancor Governance Contract           |
| vBNT                 | [`0x48Fb253446873234F2fEBbF9BdeAA72d9d387f94`](https://etherscan.io/address/0x48Fb253446873234F2fEBbF9BdeAA72d9d387f94) | Bancor Governance Token              |

### Ropsten

| Contract             | Address                                      | Comment                              |
|----------------------|----------------------------------------------|--------------------------------------|
| BancorGovernance     | [`0x161f28A417361961E946Ae03EF0A425008b7F01B`](https://ropsten.etherscan.io/address/0x161f28A417361961E946Ae03EF0A425008b7F01B) | Bancor Governance Contract           |
| vBNT                 | [`0x83ec8129b1F54BA5b0f47bD902A79C803e20A249`](https://ropsten.etherscan.io/address/0x83ec8129b1F54BA5b0f47bD902A79C803e20A249) | Bancor Governance Token              |

### Kovan

| Contract             | Address                                      | Comment                              |
|----------------------|----------------------------------------------|--------------------------------------|
| BancorGovernance     | [`0x6F1DfdA2a7303d88d9a5AEe694988158102de668`](https://kovan.etherscan.io/address/0x6F1DfdA2a7303d88d9a5AEe694988158102de668) | Bancor Governance Contract           |
| wETH                 | [`0xd0a1e359811322d97991e03f863a0c30c2cf029c`](https://kovan.etherscan.io/address/0xd0a1e359811322d97991e03f863a0c30c2cf029c) | Wrapped ETH configured as vote Token |


### Features
- Updated to the latest version of Open Zeppelin contracts
- Solidity 0.6.12
- Unit tests written in typescript
- Solhint for linting contracts
- snyk for resolving dependency issues
- Removed reward
- 98% code coverage
- Gnosis Multi Sig Wallet support and tests
- Docs generator
