"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Transaction {
  id: string;
  fecha: string | Date;
  concepto: string;
  categoria: string;
  monto: number;
  tipoTransaccion: 'income' | 'expense';
  tipoMovimiento: 'efectivo' | 'digital' | 'ahorro' | 'tarjeta';
}

interface TransactionsListProps {
  transactions: Transaction[];
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

export function TransactionsList({ 
  transactions = [], 
  onEditTransaction, 
  onDeleteTransaction 
}: TransactionsListProps) {
  const { formatMoney } = useCurrency();

  if (!transactions.length) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        No hay transacciones para mostrar.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Concepto</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          {(onEditTransaction || onDeleteTransaction) && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell className="font-medium">
              {format(new Date(transaction.fecha), "dd MMM yyyy", { locale: es })}
            </TableCell>
            <TableCell>{transaction.concepto}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {transaction.categoria}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge 
                className={`capitalize ${
                  transaction.tipoTransaccion === 'income' 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {transaction.tipoMovimiento}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <span className={`font-medium ${
                transaction.tipoTransaccion === 'income' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.tipoTransaccion === 'income' ? '+' : '-'} {formatMoney(transaction.monto)}
              </span>
            </TableCell>
            {(onEditTransaction || onDeleteTransaction) && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEditTransaction && (
                    <Button variant="ghost" size="icon" onClick={() => onEditTransaction(transaction)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteTransaction && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => onDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 