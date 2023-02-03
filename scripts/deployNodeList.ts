import { ethers, network, upgrades } from "hardhat";
import { NodeList__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { hashBytecodeWithoutMetadata, Manifest } from "@openzeppelin/upgrades-core";

async function main(): Promise<void> {
  const signers: SignerWithAddress[] = await ethers.getSigners();
  const whiteList: string[] = JSON.parse(process.env.WHITE_LIST as string);
  console.log("Deployer:", signers[0].address);
  console.log("Balance:", ethers.utils.formatEther(await signers[0].getBalance()));
  console.log("Total signers", signers.length);

  const NodeList: NodeList__factory = (await ethers.getContractFactory("NodeList")) as NodeList__factory;
  const epoch = 1;
  const nodelistProxy = await upgrades.deployProxy(NodeList, [epoch]);
  await nodelistProxy.deployed();

  console.log("Node List deployed to: ", nodelistProxy.address);

  // Peer into OpenZeppelin manifest to extract the implementation address
  const ozUpgradesManifestClient = await Manifest.forNetwork(network.provider);
  const manifest = await ozUpgradesManifestClient.read();
  const bytecodeHash = hashBytecodeWithoutMetadata(NodeList.bytecode);
  const implementationContract = manifest.impls[bytecodeHash];
  console.log("Logic contract", implementationContract?.address);

  for (let i = 0; i < whiteList.length; i++) {
    const tx = await nodelistProxy.updateWhitelist(epoch, whiteList[i], true);
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
