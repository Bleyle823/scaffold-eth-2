"use client";

import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

export const PiggyBankEvents = () => {
  const { address: connectedAddress } = useAccount();

  const { data: depositEvents } = useScaffoldEventHistory({
    contractName: "PiggyBank",
    eventName: "Deposit",
    fromBlock: 0n,
    filters: { user: connectedAddress },
    blockData: true,
  });

  const { data: withdrawalEvents } = useScaffoldEventHistory({
    contractName: "PiggyBank",
    eventName: "Withdrawal",
    fromBlock: 0n,
    filters: { user: connectedAddress },
    blockData: true,
  });

  const { data: emergencyEvents } = useScaffoldEventHistory({
    contractName: "PiggyBank",
    eventName: "PiggyBankSmashed",
    fromBlock: 0n,
    filters: { user: connectedAddress },
    blockData: true,
  });

  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const formatUnlockTime = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  if (!depositEvents?.length && !withdrawalEvents?.length && !emergencyEvents?.length) {
    return (
      <div className="bg-base-100 rounded-3xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        <p className="text-base-content/70">No transactions found for your address.</p>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-3xl p-8 shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
      
      <div className="space-y-4">
        {/* Deposit Events */}
        {depositEvents?.map((event, index) => (
          <div key={`deposit-${index}`} className="bg-base-200 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-success">💰 Deposit</h3>
                <p className="text-sm text-base-content/70">
                  Amount: {formatEther(event.args.amount)} ETH
                </p>
                <p className="text-sm text-base-content/70">
                  Unlocks: {formatUnlockTime(event.args.unlockTime)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-content/50">
                  {event.blockData?.timestamp ? formatTimestamp(event.blockData.timestamp) : "Unknown time"}
                </p>
                <p className="text-xs text-base-content/50">
                  Block: {event.blockData?.blockNumber?.toString() || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Withdrawal Events */}
        {withdrawalEvents?.map((event, index) => (
          <div key={`withdrawal-${index}`} className="bg-base-200 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-primary">💸 Withdrawal</h3>
                <p className="text-sm text-base-content/70">
                  Amount: {formatEther(event.args.amount)} ETH
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-content/50">
                  {event.blockData?.timestamp ? formatTimestamp(event.blockData.timestamp) : "Unknown time"}
                </p>
                <p className="text-xs text-base-content/50">
                  Block: {event.blockData?.blockNumber?.toString() || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Emergency Withdrawal Events */}
        {emergencyEvents?.map((event, index) => (
          <div key={`emergency-${index}`} className="bg-base-200 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-warning">🚨 Emergency Withdrawal</h3>
                <p className="text-sm text-base-content/70">
                  Total Amount: {formatEther(event.args.amount)} ETH (10% penalty applied)
                </p>
                <p className="text-sm text-warning">
                  Received: {formatEther((event.args.amount * 9n) / 10n)} ETH
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-base-content/50">
                  {event.blockData?.timestamp ? formatTimestamp(event.blockData.timestamp) : "Unknown time"}
                </p>
                <p className="text-xs text-base-content/50">
                  Block: {event.blockData?.blockNumber?.toString() || "Unknown"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 