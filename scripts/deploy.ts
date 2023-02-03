import { ethers, upgrades } from "hardhat";
import {
  Arcana,
  Arcana__factory,
  Factory,
  Factory__factory,
  Forwarder__factory,
  DID__factory,
  RoleLib,
  RoleLib__factory,
  Forwarder,
} from "../typechain";
import fs from "fs";
import { registerFunctions, registerForwarderMethods } from "./registerForwardFunctions";

async function main(): Promise<void> {
  const RolesFactory: RoleLib__factory = (await ethers.getContractFactory("RoleLib")) as RoleLib__factory;
  const roleLib: RoleLib = await RolesFactory.deploy();
  await roleLib.deployed();
  console.log("Role library address", roleLib.address);

  const accounts = await ethers.getSigners();

  console.log("Deployer Address:", accounts[0].address);
  console.log("Balance:", ethers.utils.formatEther(await accounts[0].getBalance()));

  //deploy App logic contract
  const ArcanaFactory: Arcana__factory = (await ethers.getContractFactory("Arcana", {
    libraries: {
      RoleLib: roleLib.address,
    },
  })) as Arcana__factory;
  const logic: Arcana = await ArcanaFactory.deploy();
  await logic.deployed();
  console.log("Logic contract: ", logic.address);

  //deploy factory contract using hardhat upgrade plugin
  const FactoryFactory: Factory__factory = (await ethers.getContractFactory("Factory")) as Factory__factory;
  const factory: Factory = (await upgrades.deployProxy(FactoryFactory, [logic.address], { kind: "uups" })) as Factory;
  console.log("Factory Address:", factory.address);

  //deploy Forwarder contract
  const ForwardFactory = (await ethers.getContractFactory("Forwarder")) as Forwarder__factory;
  // const Forward = await ForwardFactory.attach("0xb328260aa7D76Fcd178efcb8b501ba1Ac1c85a44");
  const Forward = (await upgrades.deployProxy(ForwardFactory, [factory.address], { kind: "uups" })) as Forwarder;
  console.log("Forwarder Address:", Forward.address);

  const DIDfactory = (await ethers.getContractFactory("DID", {
    libraries: {
      RoleLib: roleLib.address,
    },
  })) as DID__factory;
  const DID = await upgrades.deployProxy(DIDfactory, [Forward.address, factory.address], {
    unsafeAllowLinkedLibraries: true,
    kind: "uups",
  });
  await DID.deployed();
  console.log("DID Contract:", DID.address);

  //set DID contract in factory
  const setDIDtx = await factory.setDID(DID.address);
  await setDIDtx.wait();
  console.log("Set NFT DID in factory", setDIDtx.hash);

  const defaultLimit = await factory.setDefaultLimit(5368709120, 5368709120);
  await defaultLimit.wait();
  console.log("Set default limit in factory");

  const publicKeys: string[] = JSON.parse(process.env.PUBLIC_KEYS as string);

  for (const d in publicKeys) {
    const publicKey = publicKeys[d].substring(publicKeys[d].length - 128);
    const x = "0x" + publicKey.substring(0, 64);
    const y = "0x" + publicKey.substring(64);

    const address = ethers.utils.computeAddress(publicKeys[d]);
    const modifyTx = await factory.modifyGateway(address, x, y);
    await modifyTx.wait();
    console.log(`Add ${address} as gateway node`);
  }

  //Register Forwarder functions
  const methods = registerFunctions(logic);
  await registerForwarderMethods(Forward, logic, accounts[0], methods);
  await registerForwarderMethods(Forward, DID, accounts[0], ["deleteFile", "downloadNFT"]);
  await registerForwarderMethods(Forward, factory, accounts[0], ["createNewApp"]);
  console.log("Arcana & DID Methods Registered");

  // Create New App
  const tx = await factory.createNewApp(
    accounts[0].address,
    10000000000,
    200000000,
    Forward.address,
    false,
    false,
    ethers.utils.id("App config"),
  );
  const data = await tx.wait();

  // console.log(data.events[3].args.appProxy);
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

  const no_ui_tx = await factory.toggleWalletType(app_address);
  await no_ui_tx.wait();
  console.log("Wallet type is set to No UI for above app");

  //check if CI triggered the deploy
  if (!!(process.env.CI_DEPLOY as string) == true) {
    const contracts = {
      Forwarder: Forward.address,
      Factory: factory.address,
      App: app_address,
      DID: DID.address,
    };

    await fs.promises.writeFile("../contracts.json", JSON.stringify(contracts)).catch(err => {
      throw new Error(err.toString());
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
