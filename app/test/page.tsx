'use client'

import { useState } from 'react'
import { useBlink } from '@dialectlabs/blinks';
import { useBlinkSolanaWalletAdapter } from '@dialectlabs/blinks/hooks/solana';
import { Blink } from '@dialectlabs/blinks';
import { useConnection } from '@solana/wallet-adapter-react';

export default function TestBlinks() {
  const { connection } = useConnection();
  const { adapter } = useBlinkSolanaWalletAdapter(connection);
  const [selectedAction, setSelectedAction] = useState('transfer-sol');

  const getActionUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const res = `${baseUrl}/api/actions/${selectedAction}`;
    return res;
  };

  const { blink, isLoading } = useBlink({
    url: `https://dial.to/?action=solana-action:${encodeURIComponent(getActionUrl())}`,
    // url: `https://dial.to/?action=solana-action%3Ahttps%3A%2F%2Fbonkblinks.com%2Fapi%2Factions%2Flock%3F_brf%3Da0898550-e7ec-408d-b721-fca000769498%26_bin%3Dffafbecd-bb86-435a-8722-e45bf139eab5`
  });

  if(isLoading) {
    return <div className="blink-loading">Loading blink...</div>;
  }

  if (!blink) {
    return <div className="blink-not-found">Blink not found</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Blinks</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Action:</label>
        <select 
          value={selectedAction} 
          onChange={(e) => setSelectedAction(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="donate-sol">Donate SOL</option>
          <option value="transfer-sol">Transfer SOL</option>
        </select>
      </div>

      <div className="mb-4 p-4 bg-blue-100 border border-blue-400 rounded">
        <p className="font-medium">Testing URLs:</p>
        <p className="text-sm break-all">{getActionUrl()}</p>
        <p className="text-sm mt-2">
          <strong>Direct test:</strong>{' '}
          <a 
            href={``}
            target="_blank"
            className="text-blue-600 underline"
          >
            Test on dial.to
          </a>
        </p>
      </div>

      <div className="blink-container">
        <Blink
          blink={blink}
          adapter={adapter}
          stylePreset="default"
        />
      </div>
    </div>
  );
}