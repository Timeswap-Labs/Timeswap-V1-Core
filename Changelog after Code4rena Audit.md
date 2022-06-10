# Timeswap Changelog after the Code4rena Audit

# Overview

This doc specifies all changes in the Timeswap Core and Convenience Contracts after the most recent [audit](https://code4rena.com/reports/2022-03-timeswap/) by Code4rena.

**Repositories**

1. https://github.com/Timeswap-Labs/Timeswap-V1-Core
2. https://github.com/Timeswap-Labs/Timeswap-V1-Convenience/

Only the changes in the main branch are considered for the purpose of this documentation. Also only material changes in the Smart Contracts are considered for the purpose of this documentation.

**CHANGES**

1. **YMin : Interest decrease (in the case of a lend) and Interest increase (in the case of a borrow) must be greater than the minimum deltaY:**

Timeswap Dapp did not have a Minimum DeltaY whenever a lend / borrow transaction was executed. Which resulted in the possibility that every single borrow transaction can be executed at 0% APR for that respective transaction; similarly every lend transaction had the option to choose maximum CDP with 0% APR. Further details regarding the YMin can be found over [here](https://timeswap.gitbook.io/timeswap/deep-dive/lending) in the case of a lending transaction and over [here](https://timeswap.gitbook.io/timeswap/deep-dive/borrowing) in the case of a borrowing transaction.

Commits in relation to the change:

- Core Repository: [ Merge pull request #85 from Timeswap-Labs/add-min 97e892b](https://github.com/Timeswap-Labs/Timeswap-V1-Core/commit/97e892b42339f13d51c3a940b0af83cddee5d27a)
- Convenience Repository: [ Merge pull request #85 from Timeswap-Labs/add-min 641c38d](https://github.com/Timeswap-Labs/Timeswap-V1-Convenience/commit/641c38d62d3a1351e7d8c7207bf4eab1eb544fa6)