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
| BancorGovernance                  | `0xf648d3920188f79d045e35007ad1c3158d47732b` | Bancor Governance Contract           |
| wETH                              | `0x0a180A76e4466bF68A7F86fB029BEd3cCcFaAac5` | Wrapped ETH configured as vote Token |

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
