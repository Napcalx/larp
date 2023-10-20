import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "../utils/abi.json";
import {
  IHybridPaymaster,
  SponsorUserOperationDto,
  PaymasterMode,
} from "@biconomy/paymaster";
import { BiconomySmartAccount } from "@biconomy/account";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import styles from "@/styles/Home.module.css";

const counter = "0x1B975e4CdC1e962D57B500Ed60c993774096a223";
interface Props {
  smartAccount: BiconomySmartAccount;
  address: string;
  provider: ethers.providers.Provider;
}

const jsonProvider = new ethers.providers.JsonRpcProvider(
  "https://base-goerli.public.blastapi.io"
);

let tokens: Number[] = [];

const View: React.FC<Props> = ({ smartAccount, address, provider }) => {
  const [increment, setIncrement] = useState<boolean>(false);
  const [view, setView] = useState<boolean>(false);
  const contract = new ethers.Contract(counter, abi, provider);

  const handleView = async () => {
    setView(true);

    try {
      toast.info("Viewing...", {
        position: "top-right",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });  
      const minTx = await contract.populateTransaction.mint();
      console.log(minTx.data);
      const tx1 = {
        to: counter,
        data: minTx.data,
      };
      let userOp = await smartAccount.buildUserOp([tx1]);
      console.log({ userOp });
      const biconomyPaymaster =
        smartAccount.paymaster as IHybridPaymaster<SponsorUserOperationDto>;
      let paymasterServiceData: SponsorUserOperationDto = {
        mode: PaymasterMode.SPONSORED,
      };
      const paymasterAndDataResponse =
        await biconomyPaymaster.getPaymasterAndData(
          userOp,
          paymasterServiceData
        );

      userOp.paymasterAndData = paymasterAndDataResponse.paymasterAndData;
      const userOpResponse = await smartAccount.sendUserOp(userOp);
      console.log("userOpHash", userOpResponse);
      const { receipt } = await userOpResponse.wait(1);
      setView(false);
      setIncrement(true);
      toast.success(
        `Success! Here is your transaction:${receipt.transactionHash} `,
        {
          position: "top-right",
          autoClose: 18000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
      console.log("txHash", receipt.transactionHash);
    } catch (err: any) {
      console.error(err);
      console.log(err);
    }
  };

  // check mint
  useEffect(() => {
    (async() => {
      console.log(address)
      const nftContract = new ethers.Contract(counter, abi, jsonProvider);
      tokens = await nftContract.tokensOfOwner(address);
      if(tokens.length >= 1){
        setIncrement(true);
      }
      
    })();
  }, [increment])
 

  return (
    <>
      {address && !increment && (
        <button onClick={handleView} className={styles.connect}>
          {!View ? "View last User" : "Viewing"}
        </button>
      )}
    </>
  );
}

export default View;