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

### Ropsten

| Contract                          | Address                                      | Comment                              |
|-----------------------------------|----------------------------------------------|--------------------------------------|
| BancorGovernance                  | [`0xdEC39088ee1A837090a7647Be0039b2E8B3a8349`](https://ropsten.etherscan.io/address/0xdEC39088ee1A837090a7647Be0039b2E8B3a8349) | Bancor Governance Contract           |
| wETH                              | [`0xc778417E063141139Fce010982780140Aa0cD5Ab`](https://ropsten.etherscan.io/address/0xc778417E063141139Fce010982780140Aa0cD5Ab) | Wrapped ETH configured as vote Token |

### Kovan

| Contract                          | Address                                      | Comment                              |
|-----------------------------------|----------------------------------------------|--------------------------------------|
| BancorGovernance                  | [`0x6F1DfdA2a7303d88d9a5AEe694988158102de668`](https://kovan.etherscan.io/address/0x6F1DfdA2a7303d88d9a5AEe694988158102de668) | Bancor Governance Contract           |
| wETH                              | [`0xd0a1e359811322d97991e03f863a0c30c2cf029c`](https://kovan.etherscan.io/address/0xd0a1e359811322d97991e03f863a0c30c2cf029c) | Wrapped ETH configured as vote Token |

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
