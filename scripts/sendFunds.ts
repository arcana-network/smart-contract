import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

async function main(): Promise<void> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const whiteList: string[] = JSON.parse(process.env.STORAGE_NODE as string);

  console.log("Sending funds to whitelisted accounts");
  for (let i = 0; i < whiteList.length; i++) {
    const tx = await signers[0].sendTransaction({
      to: whiteList[i],
      value: ethers.utils.parseEther("1"),
    });

    await tx.wait();
    console.log(`${whiteList[i]}: `, tx.hash);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
