"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Home() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // load existing transactions from backend if available
    fetch(`${API}/transactions`).then(async (res) => {
      if (res.ok) {
        const list = await res.json();
        setTransactions(list || []);
      }
    }).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!accountId || Number.isNaN(parsedAmount)) return;

    const body = { account_id: accountId, amount: parsedAmount };
    try {
      const resp = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('Failed');
      const transaction = await resp.json();

      // fetch account balance
      let balance = null;
      try {
        const a = await fetch(`${API}/accounts/${accountId}`);
        if (a.ok) {
          const jb = await a.json();
          balance = jb.balance;
        }
      } catch (err) {
        // ignore
      }

      const newT = { ...transaction, balance };
      setTransactions(prev => [newT, ...prev]);

      // clear inputs
      setAccountId("");
      setAmount("");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('submit failed', err);
    }
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Accounting</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            data-type="account-id"
            placeholder="Account ID"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <input
            data-type="amount"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input data-type="transaction-submit" type="submit" value="Submit" />
        </form>

        <div className={styles.list}>
          {transactions.map((t, idx) => (
            <div
              key={t.transaction_id}
              data-type="transaction"
              data-account-id={t.account_id}
              data-amount={t.amount}
              data-balance={t.balance ?? ''}
              className={styles.transaction}
            >
              <div>Account: {t.account_id}</div>
              <div>Amount: {t.amount}</div>
              {typeof t.balance === 'number' && <div>Balance: {t.balance}</div>}
              <div className={styles.ts}>{t.created_at}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
