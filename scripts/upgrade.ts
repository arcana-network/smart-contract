import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Arcana, Arcana__factory, Forwarder__factory } from "../typechain";
import { sign } from "./signer";

async function main(): Promise<void> {
  const accounts: SignerWithAddress[] = await ethers.getSigners();

  console.log("Deployer Address:", accounts[0].address);
  console.log("Balance:", ethers.utils.formatEther(await accounts[0].getBalance()));

  const ForwardFactory = (await ethers.getContractFactory("Forwarder")) as Forwarder__factory;
  let Forward = await ForwardFactory.attach("0xE41390d07BE5032F1EF9b27C316217987525f843");

  const Arcana: Arcana__factory = (await ethers.getContractFactory("Arcana")) as Arcana__factory;
  const arcana_new: Arcana = await Arcana.deploy();
  await arcana_new.deployed();
  console.log("New contract deployed at", arcana_new.address);
  const arcana_old: Arcana = await Arcana.attach("0x73A15a259d1bB5ACC23319CCE876a976a278bE82");
  const privateKeys: string[] = JSON.parse(process.env.GATEWAY_WALLETS as string);
  const gatewayWallet = new ethers.Wallet(privateKeys[0], ethers.provider);
  Forward = Forward.connect(gatewayWallet);
  console.log("owner", await arcana_old.owner());
  await sign(accounts[0], arcana_old, Forward, "upgradeTo", [arcana_new.address]);
  console.log("Contract updated");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
