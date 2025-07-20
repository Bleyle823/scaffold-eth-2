"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { 
  useScaffoldReadContract, 
  useScaffoldWriteContract 
} from "~~/hooks/scaffold-eth";
import { 
  Address, 
  EtherInput, 
  Balance 
} from "~~/components/scaffold-eth";
import { 
  BanknotesIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { PiggyBankEvents } from "./_components/PiggyBankEvents";

const PiggyBankPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [lockDuration, setLockDuration] = useState("1day");
  const [addFundsAmount, setAddFundsAmount] = useState("");

  // Read contract data
  const { data: piggyBankData } = useScaffoldReadContract({
    contractName: "PiggyBank",
    functionName: "getPiggyBank",
    args: [connectedAddress],
  });

  // Destructure the piggy bank data
  const [amount, unlockTime, isUnlocked, exists] = piggyBankData || [0n, 0n, false, false];

  const { data: timeLeft } = useScaffoldReadContract({
    contractName: "PiggyBank",
    functionName: "getTimeLeft",
    args: [connectedAddress],
  });

  // Write contract functions
  const { writeContractAsync: writePiggyBankAsync } = useScaffoldWriteContract({
    contractName: "PiggyBank",
  });

  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Update time remaining every second
  useEffect(() => {
    if (timeLeft && timeLeft > 0) {
      const interval = setInterval(() => {
        const remaining = Number(timeLeft) - Math.floor(Date.now() / 1000);
        if (remaining > 0) {
          const days = Math.floor(remaining / 86400);
          const hours = Math.floor((remaining % 86400) / 3600);
          const minutes = Math.floor((remaining % 3600) / 60);
          const seconds = remaining % 60;
          
          setTimeRemaining(
            `${days}d ${hours}h ${minutes}m ${seconds}s`
          );
        } else {
          setTimeRemaining("Unlocked!");
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining("No lock period");
    }
  }, [timeLeft]);

  const handleCreatePiggyBank = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await writePiggyBankAsync({
        functionName: "createPiggyBank",
        args: [getLockDurationInSeconds(lockDuration)],
        value: parseEther(depositAmount),
      });
      setDepositAmount("");
    } catch (error) {
      console.error("Error creating piggy bank:", error);
    }
  };

  const handleAddFunds = async () => {
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await writePiggyBankAsync({
        functionName: "addFunds",
        value: parseEther(addFundsAmount),
      });
      setAddFundsAmount("");
    } catch (error) {
      console.error("Error adding funds:", error);
    }
  };

  const handleWithdraw = async () => {
    try {
      await writePiggyBankAsync({
        functionName: "withdraw",
      });
    } catch (error) {
      console.error("Error withdrawing:", error);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!confirm("Are you sure? This will incur a 10% penalty!")) {
      return;
    }

    try {
      await writePiggyBankAsync({
        functionName: "emergencyWithdraw",
      });
    } catch (error) {
      console.error("Error emergency withdrawing:", error);
    }
  };

  const getLockDurationInSeconds = (duration: string): bigint => {
    switch (duration) {
      case "1hour": return BigInt(3600);
      case "1day": return BigInt(86400);
      case "1week": return BigInt(604800);
      case "1month": return BigInt(2592000);
      case "1year": return BigInt(31536000);
      default: return BigInt(86400);
    }
  };

  const formatUnlockTime = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">🐷 PiggyBank</span>
          <span className="block text-lg mt-2">Time-locked Savings Contract</span>
        </h1>

        {connectedAddress && (
          <div className="flex justify-center items-center space-x-2 flex-col mb-8">
            <p className="font-medium">Your Address:</p>
            <Address address={connectedAddress} />
            <Balance address={connectedAddress} />
          </div>
        )}

        {/* PiggyBank Status */}
        {exists && (
          <div className="bg-base-100 rounded-3xl p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <BanknotesIcon className="h-6 w-6 mr-2" />
              Your PiggyBank
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-base-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-2">Savings Amount</h3>
                <p className="text-3xl font-bold text-primary">
                  {formatEther(amount)} ETH
                </p>
              </div>
              
              <div className="bg-base-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Time Remaining
                </h3>
                <p className={`text-2xl font-bold ${timeRemaining === "Unlocked!" ? "text-success" : "text-warning"}`}>
                  {timeRemaining}
                </p>
                {unlockTime > 0 && (
                  <p className="text-sm text-base-content/70 mt-1">
                    Unlocks: {formatUnlockTime(unlockTime)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              {isUnlocked ? (
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleWithdraw}
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Withdraw All Funds
                </button>
              ) : (
                <button
                  className="btn btn-warning flex-1"
                  onClick={handleEmergencyWithdraw}
                >
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Emergency Withdraw (10% Penalty)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Create New PiggyBank */}
        {!exists && (
          <div className="bg-base-100 rounded-3xl p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Create New PiggyBank</h2>
            <p className="text-base-content/70 mb-6">
              Deposit ETH and lock it for a specified period. You can only withdraw after the lock period expires.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Deposit Amount (ETH)</span>
                </label>
                <EtherInput
                  value={depositAmount}
                  onChange={setDepositAmount}
                  placeholder="0.1"
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Lock Duration</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={lockDuration}
                  onChange={(e) => setLockDuration(e.target.value)}
                >
                  <option value="1hour">1 Hour</option>
                  <option value="1day">1 Day</option>
                  <option value="1week">1 Week</option>
                  <option value="1month">1 Month</option>
                  <option value="1year">1 Year</option>
                </select>
              </div>
              
              <button
                className="btn btn-primary w-full"
                onClick={handleCreatePiggyBank}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
              >
                <BanknotesIcon className="h-5 w-5 mr-2" />
                Create PiggyBank
              </button>
            </div>
          </div>
        )}

        {/* Add Funds to Existing PiggyBank */}
        {exists && (
          <div className="bg-base-100 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Add More Funds</h2>
            <p className="text-base-content/70 mb-6">
              Add more ETH to your existing piggy bank. The lock time will only extend if the new duration is longer.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Additional Amount (ETH)</span>
                </label>
                <EtherInput
                  value={addFundsAmount}
                  onChange={setAddFundsAmount}
                  placeholder="0.05"
                />
              </div>
              
              <button
                className="btn btn-secondary w-full"
                onClick={handleAddFunds}
                disabled={!addFundsAmount || parseFloat(addFundsAmount) <= 0}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Funds
              </button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-base-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold mb-4">How it works</h3>
          <ul className="space-y-2 text-sm">
            <li>• Deposit ETH and choose a lock duration</li>
            <li>• Funds are locked until the time period expires</li>
            <li>• You can add more funds anytime</li>
            <li>• Withdraw only after the lock period ends</li>
            <li>• Emergency withdrawal available with 10% penalty</li>
          </ul>
        </div>

        {/* Transaction History */}
        <div className="mt-8">
          <PiggyBankEvents />
        </div>
      </div>
    </div>
  );
};

export default PiggyBankPage; 