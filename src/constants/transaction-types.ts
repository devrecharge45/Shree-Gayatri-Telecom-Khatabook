export enum TransactionType {
  CREDIT = 'CREDIT', // You Got / Inflow (Party paid you)
  DEBIT = 'DEBIT' // You Gave / Outflow (You gave money/goods to party)
}

export enum PartyFilter {
  ALL = 'all',
  GET = 'get', // You will get (balance > 0)
  GIVE = 'give', // You will give (balance < 0)
  SETTLED = 'settled' // Settled (balance == 0)
}
