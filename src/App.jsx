import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import axios from 'axios';
import './App.css';

const JETTONS_JSON_URL = 'https://raw.githubusercontent.com/your-username/openjettons/main/jettons.json';

function App() {
  const [jettons, setJettons] = useState([]);
  const [balances, setBalances] = useState({});
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  // Загружаем jettons.json
  useEffect(() => {
    axios.get(JETTONS_JSON_URL)
      .then(response => {
        setJettons(response.data);
      })
      .catch(error => {
        console.error('Error fetching jettons.json:', error);
      });
  }, []);

  // Проверяем баланс jetton'ов при подключении кошелька
  useEffect(() => {
    if (!userAddress) return;

    const fetchBalances = async () => {
      const newBalances = {};
      for (const jetton of jettons) {
        try {
          const response = await axios.get(
            `https://toncenter.com/api/v2/getTokenData?address=${jetton.address}&owner_address=${userAddress}`
          );
          const balance = response.data.balance / Math.pow(10, jetton.decimals);
          newBalances[jetton.address] = balance;
        } catch (error) {
          console.error(`Error fetching balance for ${jetton.address}:`, error);
          newBalances[jetton.address] = 0;
        }
      }
      setBalances(newBalances);
    };

    fetchBalances();
  }, [userAddress, jettons]);

  return (
    <div className="app">
      <h1>OpenJettons Wallet</h1>
      {userAddress ? (
        <div>
          <p>Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
          <button onClick={() => tonConnectUI.disconnect()}>Disconnect</button>
          <h2>Jettons</h2>
          {jettons.length === 0 ? (
            <p>Loading jettons...</p>
          ) : (
            <ul>
              {jettons.map(jetton => (
                <li key={jetton.address}>
                  <img src={jetton.image} alt={jetton.name} width="32" />
                  <span>{jetton.name} ({jetton.symbol})</span>
                  <span>Balance: {balances[jetton.address] || 'Loading...'} {jetton.symbol}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <button onClick={() => tonConnectUI.connectWallet()}>Connect Wallet</button>
      )}
    </div>
  );
}

export default function WrappedApp() {
  return (
    <TonConnectUIProvider manifestUrl="https://your-username.github.io/openjettons-wallet/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}
