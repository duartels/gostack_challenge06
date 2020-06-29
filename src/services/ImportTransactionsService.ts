import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import upload from '../config/upload';
import CreationTransactionService from './CreateTransactionService';

interface Request {
  file: string;
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
interface dataTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute({ file }: Request): Promise<Transaction[]> {
    async function loadCSV(filePath: string): Promise<any[]> {
      const readCSVStream = fs.createReadStream(filePath);

      const parseStream = csvParse({
        from_line: 2,
        ltrim: true,
        rtrim: true,
      });

      const parseCSV = readCSVStream.pipe(parseStream);

      const lines: dataTransaction[] = [];

      parseCSV.on('data', line => {
        const [title, type, value, category] = line.map((cell: string) =>
          cell.trim(),
        );

        if (!title || !type || !value || !category) return;

        lines.push({ title, type, value, category });
      });

      await new Promise(resolve => {
        parseCSV.on('end', resolve);
      });

      await fs.promises.unlink(filePath);

      return lines;
    }

    const csvFilePath = path.join(upload.directory, file);

    const dataTransactions = await loadCSV(csvFilePath);

    // console.log(dataTransactions);

    const transactions = [];

    const createTransactionService = new CreationTransactionService();

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < dataTransactions.length; i++) {
      const dataTransaction: dataTransaction = dataTransactions[i];
      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransactionService.execute({
        title: dataTransaction.title,
        type: dataTransaction.type,
        value: dataTransaction.value,
        category: dataTransaction.category,
      });

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
