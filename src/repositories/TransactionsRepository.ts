import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance: Balance = transactions.reduce(
      (acc: Balance, transaction: Transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.value;
        } else {
          acc.outcome += transaction.value;
        }
        return acc;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );

    balance.total = balance.income - balance.outcome;

    return balance;
  }

  public async getTransactionsWithCategory(): Promise<Transaction[]> {
    const transactions = await this.find();
    const categoriesRepository = getRepository(Category);
    const categories = await categoriesRepository.find();

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];

      // eslint-disable-next-line no-plusplus
      for (let j = 0; j < categories.length; j++) {
        const category = categories[j];

        if (category.id === transaction.category_id) {
          transaction.category = category;
        }
      }

      delete transaction.category_id;
    }

    return transactions;
  }
}

export default TransactionsRepository;
