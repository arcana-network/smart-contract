import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { sign } from "../scripts/signer";
import { Arcana, Arcana__factory, DID, Factory, Forwarder } from "../typechain";

export const IDs = [
  "0x4de0e96b0a8886e42a2c35b57df8a9d58a93b5bff655bc37a30e2ab8e29dc066",
  "0x3d725c5ee53025f027da36bea8d3af3b6a3e9d2d1542d47c162631de48e66c1c",
  "0x967f2a2c7f3d22f9278175c1e6aa39cf9171db91dceacd5ee0f37c2e507b5abe",
  "0x6e65772069640000000000000000000000000000000000000000000000000000",
];

const AccessTypes = {
  read: ethers.utils.formatBytes32String("read"),
  reshare: ethers.utils.formatBytes32String("reshare"),
  delete: ethers.utils.formatBytes32String("delete"),
};

export const createApp = async (
  factory: Factory,
  owner: SignerWithAddress,
  store: BigNumber,
  bandwidth: BigNumber,
  Forward: Forwarder,
  arcana: Arcana,
  DID: DID,
  ArcanaFactory: Arcana__factory,
): Promise<Arcana> => {
  const tx2 = await factory.setDID(DID.address);
  await tx2.wait();
  const tx3 = await factory.setDefaultLimit(ethers.constants.MaxUint256, ethers.constants.MaxUint256);
  await tx3.wait();

  const tx = await factory.createNewApp(
    owner.address,
    store,
    bandwidth,
    Forward.address,
    false,
    true,
    ethers.utils.id("hash_of_app_config"),
  );
  const data = await tx.wait();
  if (!data.events) data.events = [];
  const abi = ["event NewApp(address owner, address appProxy)"];
  const iface = new ethers.utils.Interface(abi);
  await Promise.all(
    data.events.map(async d => {
      if (d.topics.includes(iface.getEventTopic("NewApp"))) {
        const args = iface.parseLog(d).args;
        arcana = await ArcanaFactory.attach(args.appProxy);
      }
    }),
  );

  return arcana;
};

export const uploadInit = async (
  factory: Factory,
  storageNode: SignerWithAddress,
  owner: SignerWithAddress,
  store: BigNumber,
  bandwidth: BigNumber,
  Forward: Forwarder,
  arcana: Arcana,
  DID: DID,
  ArcanaFactory: Arcana__factory,
  fileSize: BigNumber,
): Promise<Arcana> => {
  arcana = await createApp(factory, owner, store, bandwidth, Forward, arcana, DID, ArcanaFactory);
  const fileId = IDs[0];
  const fileName = ethers.utils.id("<file-name>");
  const fileHash = ethers.utils.id("<file-hash>");
  const ephemeralWallet = ethers.Wallet.createRandom();

  await sign(owner, arcana, Forward, "uploadInit", [
    fileId,
    fileSize,
    fileName,
    fileHash,
    storageNode.address,
    ephemeralWallet.address,
  ]);
  return arcana;
};

export const upload = async (
  factory: Factory,
  storageNode: SignerWithAddress,
  owner: SignerWithAddress,
  store: BigNumber,
  bandwidth: BigNumber,
  Forward: Forwarder,
  arcana: Arcana,
  DID: DID,
  ArcanaFactory: Arcana__factory,
  fileSize: BigNumber,
): Promise<Arcana> => {
  arcana = await uploadInit(
    factory,
    storageNode,
    owner,
    store,
    bandwidth,
    Forward,
    arcana,
    DID,
    ArcanaFactory,
    fileSize,
  );
  const fileId = IDs[0];
  const tx = await arcana.connect(storageNode).uploadClose(fileId);
  await tx.wait();
  const [_fileSize] = await DID.getFile(fileId);
  const consumptionAccount0 = await arcana.consumption(owner.address);
  expect(consumptionAccount0.store).to.equal(fileSize);
  expect(_fileSize).equal(fileSize);
  return arcana;
};

export const share = async (
  factory: Factory,
  owner: SignerWithAddress,
  recevier: SignerWithAddress,
  store: BigNumber,
  bandwidth: BigNumber,
  Forward: Forwarder,
  arcana: Arcana,
  DID: DID,
  ArcanaFactory: Arcana__factory,
  fileSize: BigNumber,
): Promise<Arcana> => {
  arcana = await upload(factory, recevier, owner, store, bandwidth, Forward, arcana, DID, ArcanaFactory, fileSize);
  const files = [IDs[0]];
  const user = [recevier.address];
  const accessType = [AccessTypes.read];
  const validity = [150];
  await sign(owner, arcana, Forward, "share", [files, user, accessType, validity]);

  return arcana;
};
