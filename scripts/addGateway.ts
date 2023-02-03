import { ethers } from "hardhat";
import { Factory, Factory__factory } from "../typechain";

async function main(): Promise<void> {
  const FactoryFactory: Factory__factory = (await ethers.getContractFactory("Factory")) as Factory__factory;
  const factory: Factory = await FactoryFactory.attach("<factory_address>");
  console.log("Factory Address:", factory.address);

  const publicKeys: string[] = JSON.parse(process.env.PUBLIC_KEYS as string);

  for (const d in publicKeys) {
    const publicKey = publicKeys[d].substring(publicKeys[d].length - 128);
    const x = "0x" + publicKey.substring(0, 64);
    const y = "0x" + publicKey.substring(64);

    const address = ethers.utils.computeAddress(publicKeys[d]);
    const modifyTx = await factory.modifyGateway(address, x, y);
    await modifyTx.wait();
    console.log(`Added ${address} as gateway node`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
