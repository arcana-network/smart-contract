import { ethers } from "hardhat";
import { Arcana, Arcana__factory, Factory__factory, Forwarder__factory, DID__factory, Forwarder } from "../typechain";

import { sign } from "./signer";

async function main(): Promise<void> {
  const accounts = await ethers.getSigners();

  const ForwardFactory = (await ethers.getContractFactory("Forwarder")) as Forwarder__factory,
    Forward: Forwarder = (await ForwardFactory.attach("<forwarder_address>")) as Forwarder,
    ArcanaFactory: Arcana__factory = (await ethers.getContractFactory("Arcana")) as Arcana__factory,
    arcana: Arcana = (await ArcanaFactory.attach("<arcana_address>")) as Arcana;

  const fileId = "<file_id>",
    tokenId = 2,
    chainId = 80001,
    nftContract = "<nft_contract_address>";

  await sign(accounts[0], arcana, Forward, "linkNFT", [fileId, tokenId, nftContract, chainId]);

  console.log(`chain ${chainId} NFT ${nftContract} - ${tokenId} linked to 
${accounts[0].address} successfully `);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
