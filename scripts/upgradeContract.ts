import { ethers, upgrades } from "hardhat";
import {
  Arcana__factory,
  Factory__factory,
  Forwarder__factory,
  DID__factory,
  ArcanaNFTHandler__factory,
} from "../typechain";

async function upgradeContract() {
  const ContractName = "ArcanaNFTHandler";
  const contractAddress = "0xF53Aa32757F5608D220C3041A8edfB0Ba72AA093";
  const NewContract = await ethers.getContractFactory(ContractName);
  await upgrades.upgradeProxy(contractAddress, NewContract);

  console.log(`${ContractName} upgraded successfully`);
}

upgradeContract()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
