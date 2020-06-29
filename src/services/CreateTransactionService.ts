import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: string;
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);

    const findExistentCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    let categoryCreated;

    if (!findExistentCategory) {
      categoryCreated = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(categoryCreated);
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();

      if (value > balance.total) {
        throw new AppError('This value is higher than the limit');
      }
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: !findExistentCategory ? categoryCreated : findExistentCategory,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
