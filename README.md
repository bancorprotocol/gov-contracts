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
| BancorGovernance                  | [`0x05AA3da21D2706681837a896433E62deEeEaB1f1`](https://ropsten.etherscan.io/address/0x05AA3da21D2706681837a896433E62deEeEaB1f1) | Bancor Governance Contract           |
| wETH                              | [`0xc778417E063141139Fce010982780140Aa0cD5Ab`](https://ropsten.etherscan.io/address/0xc778417E063141139Fce010982780140Aa0cD5Ab) | Wrapped ETH configured as vote Token |

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
