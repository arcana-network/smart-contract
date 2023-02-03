import { ethers } from "hardhat";
import { Arcana, Arcana__factory, Factory, Factory__factory, ArcanaBeacon__factory } from "../typechain";

async function upgradeContract() {
  const factoryAddress = "0xbB1de7EFB65834c8Ba570C1C1D4678bAaCbb3500";
  const FactoryFactory: Factory__factory = (await ethers.getContractFactory("Factory")) as Factory__factory;
  const factory: Factory = await FactoryFactory.attach(factoryAddress);
  const beaconAddress = await factory.getBeacon();

  const ArcanaBeaconFactory: ArcanaBeacon__factory = (await ethers.getContractFactory(
    "ArcanaBeacon",
  )) as ArcanaBeacon__factory;
  const beacon = await ArcanaBeaconFactory.attach(beaconAddress);

  //deploy new arcana implementation contract
  const ArcanaFactory: Arcana__factory = (await ethers.getContractFactory("Arcana")) as Arcana__factory;
  const logic: Arcana = await ArcanaFactory.deploy();
  await logic.deployed();

  //update beacon contract with new implementation
  const setBeaconTx = await beacon.update(logic.address);
  await setBeaconTx.wait();

  console.log(`Arcana contract upgraded successfully ${setBeaconTx.hash} `);
}

upgradeContract()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
