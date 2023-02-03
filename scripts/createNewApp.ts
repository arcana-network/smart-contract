import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Factory, Factory__factory, Forwarder__factory } from "../typechain";
import axios from "axios";

async function main(): Promise<void> {
  const accounts: SignerWithAddress[] = await ethers.getSigners();

  console.log("Wallet Address:", accounts[0].address);
  console.log("Balance:", ethers.utils.formatEther(await accounts[0].getBalance()));

  const res = await axios.get("http://localhost:9010/api/v1/get-config/");
  const config = res.data;
  const Factory: Factory__factory = (await ethers.getContractFactory("Factory")) as Factory__factory;
  const factory: Factory = await Factory.attach(config.Factory);
  await factory.deployed();
  console.log("Factory Contract: ", factory.address);

  const ForwardFactory = (await ethers.getContractFactory("Forwarder")) as Forwarder__factory;
  const Forward = await ForwardFactory.attach(config.Forwarder);
  await Forward.deployed();
  console.log("Forwarder: ", Forward.address);

  const tx = await factory.createNewApp(
    accounts[0].address,
    100000000000,
    2000000000,
    Forward.address,
    false,
    false,
    ethers.utils.id("hash of the app config"),
  );
  const data = await tx.wait();
  if (!data.events) data.events = [];
  const abi = ["event NewApp(address owner, address appProxy)"];
  const iface = new ethers.utils.Interface(abi);
  let app_address: string = "";
  await Promise.all(
    data.events.map(async d => {
      if (d.topics.includes(iface.getEventTopic("NewApp"))) {
        const args = iface.parseLog(d).args;
        app_address = args.appProxy;
        console.log("App proxy:", app_address);
      }
    }),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
