const API_URL = 'http://localhost:8080';

const form = document.getElementById('transaction-form');
const accountIdInput = document.querySelector('[data-type="account-id"]');
const amountInput = document.querySelector('[data-type="amount"]');
const transactionList = document.getElementById('transaction-list');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const accountId = accountIdInput.value.trim();
  const amount = parseFloat(amountInput.value);
  
  if (!accountId || isNaN(amount)) {
    alert('Please provide valid account ID and amount');
    return;
  }
  
  try {
    const transactionResponse = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: accountId,
        amount: amount
      })
    });
    
    if (!transactionResponse.ok) {
      throw new Error('Failed to create transaction');
    }
    
    const transaction = await transactionResponse.json();
    
    const accountResponse = await fetch(`${API_URL}/accounts/${accountId}`);
    const account = await accountResponse.json();
    
    addTransactionToList(transaction, account.balance);
    
    accountIdInput.value = '';
    amountInput.value = '';
    
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to create transaction: ' + error.message);
  }
});

function addTransactionToList(transaction, balance) {
  const previousFirst = transactionList.querySelector('[data-type="transaction"]');
  if (previousFirst) {
    const balanceDiv = previousFirst.querySelector('.balance');
    if (balanceDiv) {
      balanceDiv.remove();
      previousFirst.removeAttribute('data-balance');
    }
  }
  
  const transactionDiv = document.createElement('div');
  transactionDiv.className = 'transaction';
  transactionDiv.setAttribute('data-type', 'transaction');
  transactionDiv.setAttribute('data-account-id', transaction.account_id);
  // store attributes as plain numeric strings (no trailing decimals) to match Cypress selectors
  transactionDiv.setAttribute('data-amount', String(Number(transaction.amount)));
  transactionDiv.setAttribute('data-balance', String(Number(balance)));
  
  const amountClass = transaction.amount >= 0 ? 'positive' : 'negative';
  const amountSign = transaction.amount >= 0 ? '+' : '';

  transactionDiv.innerHTML = `
    <div class="transaction-amount ${amountClass}">
      ${amountSign}${Number(transaction.amount).toFixed(2)}
    </div>
    <div>Account: ${transaction.account_id}</div>
    <div>Transaction ID: ${transaction.transaction_id}</div>
    <div>Created: ${new Date(transaction.created_at).toLocaleString()}</div>
    <div class="balance">Current Balance: ${Number(balance).toFixed(2)}</div>
  `;
  
  // debug: print the attributes we set so Cypress run logs can show them
  try {
    console.debug('[FRONT-END DEBUG] Adding transaction element', {
      'data-account-id': transactionDiv.getAttribute('data-account-id'),
      'data-amount': transactionDiv.getAttribute('data-amount'),
      'data-balance': transactionDiv.getAttribute('data-balance'),
    });
  } catch (e) { /* ignore */ }

  transactionList.insertBefore(transactionDiv, transactionList.firstChild);
}
