import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  Arcana__factory,
  Arcana,
  ArcanaBeacon__factory,
  ArcanaTestV2__factory,
  Forwarder,
  Forwarder__factory,
  DID__factory,
  DID,
  Factory,
  RoleLib__factory,
  RoleLib,
} from "../typechain";
import { expect } from "chai";
import { sign } from "../scripts/signer";
import { Provider } from "@ethersproject/abstract-provider";
import { createApp, uploadInit, upload } from "./Arcana.behavior";
import { IDs } from "./Arcana.behavior";
import { registerForwarderMethods } from "../scripts/registerForwardFunctions";
import { TransactionResponse } from "@ethersproject/providers";
import { BigNumber } from "ethers";

describe("Contracts", () => {
  let Arcana: Arcana,
    ArcanaFactory: Arcana__factory,
    factory: Factory,
    accounts: SignerWithAddress[],
    logic: Arcana,
    Forward: Forwarder,
    ForwardFactory: Forwarder__factory,
    pubKey: string,
    DID: DID,
    roleLib: RoleLib;

  const fileSize = ethers.BigNumber.from(123);
  const store = ethers.BigNumber.from(100000);
  const bandwidth = ethers.BigNumber.from(200000);

  beforeEach("Deploy Contracts", async () => {
    const RolesFactory: RoleLib__factory = (await ethers.getContractFactory("RoleLib")) as RoleLib__factory;
    roleLib = await RolesFactory.deploy();

    ArcanaFactory = (await ethers.getContractFactory("Arcana", {
      libraries: {
        RoleLib: roleLib.address,
      },
    })) as Arcana__factory;
    logic = await ArcanaFactory.deploy();
    await logic.deployed();

    accounts = await ethers.getSigners();

    const provider = accounts[1].provider as Provider;
    let gatewayWallet = ethers.Wallet.createRandom();
    gatewayWallet = gatewayWallet.connect(provider);
    pubKey = gatewayWallet.publicKey;
    pubKey = pubKey.substring(pubKey.length - 128, pubKey.length);
    const sendtx = await accounts[1].sendTransaction({
      to: gatewayWallet.address,
      value: ethers.utils.parseEther("1.0"),
    });
    await sendtx.wait();
    const [x, y] = ["0x" + pubKey.substring(0, 64), "0x" + pubKey.substring(64, 128)];
    const FactoryFactory = await ethers.getContractFactory("Factory");
    factory = (await upgrades.deployProxy(FactoryFactory, [logic.address], { kind: "uups" })) as Factory;

    ForwardFactory = (await ethers.getContractFactory("Forwarder")) as Forwarder__factory;
    Forward = (await upgrades.deployProxy(ForwardFactory, [factory.address], { kind: "uups" })) as Forwarder;

    const DIDfactory = (await ethers.getContractFactory("DID", {
      libraries: {
        RoleLib: roleLib.address,
      },
    })) as DID__factory;
    DID = (await upgrades.deployProxy(DIDfactory, [Forward.address, factory.address], {
      unsafeAllowLinkedLibraries: true,
      kind: "uups",
    })) as DID;
    await DID.deployed();

    const tx = await factory.modifyGateway(gatewayWallet.address, x, y);
    await tx.wait();
    Forward = Forward.connect(gatewayWallet);

    await registerForwarderMethods(Forward, logic, accounts[0]);

    const tx_storageNode = await factory.modifyNode(accounts[1].address, true);
    await tx_storageNode.wait();
  });

  describe("Factory contract", async () => {
    it("Set DID", async () => {
      const tx = await factory.setDID(DID.address);
      await tx.wait();
      expect(await factory.did()).equal(DID.address);
    });

    it("Get Gateway node public key", async () => {
      const [x, y] = await factory.gateway(await Forward.signer.getAddress());
      expect(x + y.substring(2)).equal("0x" + pubKey);
    });

    it("Set defaults", async () => {
      const storage = ethers.BigNumber.from(1000000);
      const bandwidth = ethers.BigNumber.from(2000000);
      const tx = await factory.setDefaultLimit(storage, bandwidth);
      await tx.wait();
      expect(await factory.defaultStorage()).equal(storage);
      expect(await factory.defaultBandwidth()).equal(bandwidth);
    });

    it("Should create a new app", async () => {
      const store = ethers.BigNumber.from(40000000);
      const bandwidth = ethers.BigNumber.from(50000000);

      const tx = await factory.createNewApp(
        accounts[0].address,
        store,
        bandwidth,
        Forward.address,
        false,
        true,
        ethers.utils.id("<hash_of_app_config>"),
      );

      const data = await tx.wait();
      if (!data.events) data.events = [];
      const abi = ["event NewApp(address owner, address appProxy)"];
      const iface = new ethers.utils.Interface(abi);
      let flag = false;
      await Promise.all(
        data.events.map(async d => {
          if (d.topics.includes(iface.getEventTopic("NewApp"))) {
            const args = iface.parseLog(d).args;
            Arcana = await ArcanaFactory.attach(args.appProxy);
            expect(await Arcana.owner()).equal(accounts[0].address);
            flag = true;
            expect(await factory.app(Arcana.address)).to.be.equal(accounts[0].address);
            expect(await factory.onlyDKGAddress(Arcana.address)).to.be.equal(false);
          }
        }),
      );
      const limit = await Arcana.defaultLimit();
      expect(limit.store).equal(store);
      expect(limit.bandwidth).equal(bandwidth);
      expect(flag).to.be.true;
    });
  });

  describe("Configure Apps", () => {
    it("App Level", async () => {
      const store = ethers.BigNumber.from(10000000);
      const bandwidth = ethers.BigNumber.from(20000000);
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);
      await factory.setAppLevelLimit(Arcana.address, store, bandwidth);
      const limit = await Arcana.limit(ethers.constants.AddressZero);
      expect(limit.store).equal(store);
      expect(limit.bandwidth).equal(bandwidth);

      await expect(factory.connect(accounts[2]).setAppLevelLimit(Arcana.address, store, bandwidth)).to.be.revertedWith(
        "Only gateway node can call this function",
      );
    });

    it("Toggle wallet type", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);
      expect(await Arcana.walletType()).equal(1);
      await factory.toggleWalletType(Arcana.address);
      expect(await Arcana.walletType()).equal(0);
      await factory.toggleWalletType(Arcana.address);
      expect(await Arcana.walletType()).equal(1);
    });

    it("Toggle wallet type should only happen through owner", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);
      expect(await Arcana.walletType()).equal(1);
      await expect(factory.connect(accounts[1]).toggleWalletType(Arcana.address)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("User Level", async () => {
      const store = ethers.BigNumber.from(1000000);
      const bandwidth = ethers.BigNumber.from(2000000);
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);
      const user = accounts[0].address;

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["setUserLevelLimit"]);

      await sign(accounts[0], Arcana, Forward, "setUserLevelLimit", [user, store, bandwidth]);
      const limit = await Arcana.limit(user);
      expect(limit.store).equal(store);
      expect(limit.bandwidth).equal(bandwidth);
    });

    it("Default Limit", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["setDefaultLimit"]);

      await sign(accounts[0], Arcana, Forward, "setDefaultLimit", [store, bandwidth]);
      const limit = await Arcana.defaultLimit();
      expect(limit.store).equal(store);
      expect(limit.bandwidth).equal(bandwidth);
    });

    it("Set app Config", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["setAppConfig"]);

      const appConfig = ethers.utils.id("<hash_of_app_config>");
      const tx = await sign(accounts[0], Arcana, Forward, "setAppConfig", [appConfig]);
      expect(appConfig).equal(await Arcana.getAppConfig());
      expect(tx.hash).to.be.not.null;
    });
  });

  describe("After Deploy", () => {
    it("Should have valid address", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);
      expect(Arcana.address).to.not.equal(ethers.constants.AddressZero);
    });
  });

  describe("Create DID", () => {
    it("Upload Init", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      const fileId = IDs[0];
      const name = ethers.utils.id("NAME");
      const fileHash = "0x699c776c7e6ce8e6d96d979b60e41135a13a2303ae1610c8d546f31f0c6dc730";
      const storageNode = accounts[1].address;
      const ephemeralWallet = ethers.Wallet.createRandom();

      await sign(accounts[0], Arcana, Forward, "uploadInit", [
        fileId,
        fileSize,
        name,
        fileHash,
        storageNode,
        ephemeralWallet.address,
      ]);

      const [_fileSize, uploaded, _name, _fileHash, _storageNode] = await DID.getFile(fileId);
      const _owner = await DID.getFileOwner(fileId);
      expect(_owner).equal(accounts[0].address);
      expect(_name).equal(name);
      expect(_storageNode).equal(storageNode);
      expect(uploaded).to.be.false;
      expect(fileSize).equal(fileSize);
    });

    it("Upload close", async () => {
      Arcana = await uploadInit(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );
      const fileId = IDs[0];
      const arc = await Arcana.connect(accounts[1]);
      const tx = await arc.uploadClose(fileId);
      await tx.wait();
      const [, _uploaded] = await DID.getFile(fileId);
      const consumptionAccount0 = await Arcana.consumption(accounts[0].address);
      const consumptionAddress0 = await Arcana.consumption(ethers.constants.AddressZero);

      expect(_uploaded).to.be.true;
      expect(consumptionAccount0.store).to.be.equal(fileSize);
      expect(consumptionAddress0.store).to.be.equal(fileSize);
    });

    it("Download DID", async () => {
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["download"]);

      await expect(sign(accounts[0], Arcana, Forward, "download", [fileId, ephemeralWallet.address]))
        .to.emit(DID, "FilePermission")
        .withArgs(fileId, 1, Arcana.address, accounts[0].address);
    });

    it("Download via ruleSet", async () => {
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["download"]);

      await expect(sign(accounts[1], Arcana, Forward, "download", [fileId, ephemeralWallet.address]))
        .to.emit(Arcana, "DownloadViaRuleSet")
        .withArgs(fileId, accounts[1].address);
    });

    it("Add file uploaded by first App to Second App", async () => {
      const fileId = IDs[0];
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      const Arcana2 = await createApp(factory, accounts[2], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["addFile"]);

      await expect(sign(accounts[0], Arcana2, Forward, "addFile", [fileId]))
        .to.emit(DID, "FilePermission")
        .withArgs(fileId, 0, Arcana2.address, accounts[0].address);
    });

    it("Should Emit Transaction event from forwarder", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);
      const nonce = await Forward.getNonce(accounts[0].address).then((nonce: { toString: () => string }) =>
        nonce.toString(),
      );
      const filter = Forward.filters.ForwardTransaction(accounts[0].address, Arcana.address, +nonce);
      let eventTx;

      const fileId = IDs[0];
      const name = ethers.utils.id("NAME");
      const fileHash = "0x699c776c7e6ce8e6d96d979b60e41135a13a2303ae1610c8d546f31f0c6dc730";
      const storageNode = accounts[1].address;
      const ephemeralWallet = ethers.Wallet.createRandom();

      const tx: TransactionResponse = await sign(accounts[0], Arcana, Forward, "uploadInit", [
        fileId,
        fileSize,
        name,
        fileHash,
        storageNode,
        ephemeralWallet.address,
      ]);

      //Sleep and resolve only if forwarder event is emitted
      await new Promise(resolve => {
        ethers.provider.once(filter, async log => {
          eventTx = log.transactionHash;
          resolve(true);
        });
      });

      expect(eventTx).to.equal(tx.hash);
    });
  });

  describe("NFT", () => {
    it("Link NFT", async () => {
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );
      const tokenId = 123;
      const nftContract = "0xd018E133CeF28AE3F4F27b16F1AB43BBdd53BDcb";
      const chainId = 100;

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["linkNFT"]);
      await sign(accounts[0], Arcana, Forward, "linkNFT", [IDs[0], tokenId, nftContract, chainId]);
    });

    it("Download NFT", async () => {
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );
      const tokenId = 123;
      const nftContract = "0xd018E133CeF28AE3F4F27b16F1AB43BBdd53BDcb";
      const chainId = 100;

      await registerForwarderMethods(Forward, DID, accounts[0], ["downloadNFT", "linkNFT"]);

      await sign(accounts[0], Arcana, Forward, "linkNFT", [IDs[0], tokenId, nftContract, chainId]);

      await expect(sign(accounts[0], DID, Forward, "downloadNFT", [IDs[0]]))
        .to.emit(DID, "NFTDownload")
        .withArgs(IDs[0], accounts[0].address, chainId, tokenId, nftContract);
    });
  });

  describe("App Level permissions", () => {
    it("Should set/unset app level required permission", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["editAppPermission"]);

      //Set app level permission by app owner
      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, true]);

      expect(await Arcana.appLevelControl()).to.equal(1);

      //unset app level permission by app owner
      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, false]);
      expect(await Arcana.appLevelControl()).to.equal(0);
    });

    it("Should grant app permission", async () => {
      Arcana = await createApp(
        factory,

        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
      );
      await registerForwarderMethods(Forward, Arcana, accounts[0], ["editAppPermission", "grantAppPermission"]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, true]);
      await sign(accounts[3], Arcana, Forward, "grantAppPermission", []);
      expect(await Arcana.userAppPermission(accounts[3].address)).to.equal(1);
    });

    it("should be able to revoke from app", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "grantAppPermission",
        "revokeApp",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, true]);

      await sign(accounts[3], Arcana, Forward, "grantAppPermission", []);

      await sign(accounts[3], Arcana, Forward, "revokeApp", []);

      expect(await Arcana.userVersion(accounts[3].address)).to.not.equal(0);
      expect(await Arcana.userAppPermission(accounts[3].address)).to.not.equal(await Arcana.appLevelControl());
    });

    it("Negative: Should revert if app permission not granted", async () => {
      Arcana = await createApp(
        factory,

        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["editAppPermission"]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, true]);

      const fileId = IDs[0];
      const name = ethers.utils.id("NAME");
      const fileHash = "0x699c776c7e6ce8e6d96d979b60e41135a13a2303ae1610c8d546f31f0c6dc730";
      const storageNode = accounts[1].address;
      const ephemeralWallet = ethers.Wallet.createRandom();

      await expect(
        sign(accounts[3], Arcana, Forward, "uploadInit", [
          fileId,
          fileSize,
          name,
          fileHash,
          storageNode,
          ephemeralWallet.address,
        ]),
      ).to.be.revertedWith("permission_not_granted");
    });
  });

  describe("Negative test cases for creating DID", () => {
    it("upload an already existing file with new owner and fileSize shouldn't be 0", async () => {
      const fileId = IDs[0];
      const fileName = ethers.utils.id("<file-name>");
      const fileHash = ethers.utils.id("<file-hash>");
      const fileId1 = IDs[1];
      const storageNode = accounts[1].address;

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      const ephemeralWallet = ethers.Wallet.createRandom();

      await expect(
        sign(accounts[0], Arcana, Forward, "uploadInit", [
          fileId,
          fileSize,
          fileName,
          fileHash,
          storageNode,
          ephemeralWallet.address,
        ]),
      ).to.be.revertedWith("owner_already_exists");

      await expect(
        sign(accounts[0], Arcana, Forward, "uploadInit", [
          fileId1,
          0,
          fileName,
          fileHash,
          storageNode,
          ephemeralWallet.address,
        ]),
      ).to.be.revertedWith("zero_file_size");
    });

    it("uploadClose can only be called by assigned storage node", async () => {
      const fileId = IDs[0];
      await expect(Arcana.connect(accounts[2]).uploadClose(fileId)).to.be.revertedWith("only_storage_node");
    });

    it("Uploading a file that is already uploaded", async () => {
      const tx_storageNode = await factory.modifyNode(accounts[0].address, true);
      await tx_storageNode.wait();

      Arcana = await upload(
        factory,
        accounts[0],
        accounts[1],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      const fileId = IDs[0];

      await expect(Arcana.connect(accounts[0]).uploadClose(fileId)).to.be.revertedWith("file_already_uploaded");
    });
  });

  describe("Check limits", async () => {
    it("Upload limit", async () => {
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );
      const limit = await Arcana.consumption(accounts[0].address);
      expect(limit[0]).equal(fileSize);
      expect(limit[1]).equal(ethers.constants.Zero);
    });

    it("Download limit", async () => {
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );
      // Download one more time so that upload and download consumption is different
      const ephemeralWallet = ethers.Wallet.createRandom();

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["download"]);

      const tx = await sign(accounts[0], Arcana, Forward, "download", [IDs[0], ephemeralWallet.address]);

      const tx_storageNode = await Arcana.connect(accounts[1]).downloadClose(IDs[0], tx.hash);
      await tx_storageNode.wait();

      const limit = await Arcana.consumption(accounts[0].address);
      expect(limit.bandwidth).equal(fileSize);
    });

    it("Upload limit reached at userlevel", async () => {
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );
      const fileSize1 = ethers.BigNumber.from(100000);
      const fileId = IDs[1];
      const storageNode = accounts[1].address;
      const ephemeralWallet = ethers.Wallet.createRandom();
      const fileName = ethers.utils.id("NAME");
      const fileHash = ethers.utils.id("HASH");

      await expect(
        sign(accounts[0], Arcana, Forward, "uploadInit", [
          fileId,
          fileSize1,
          fileName,
          fileHash,
          storageNode,
          ephemeralWallet.address,
        ]),
      ).to.be.revertedWith("no_user_space");
    });

    it("Download limit reached at userlevel", async () => {
      const bandwidth = BigNumber.from("1000"),
        fileSize = BigNumber.from("1002");

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      // const fileSize =(await Arcana.defaultLimit())[1].add(BigNumber.from("1"));

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["setUserLevelLimit", "download"]);

      await sign(accounts[0], Arcana, Forward, "setUserLevelLimit", [
        accounts[5].address,
        store,
        BigNumber.from("1001"),
      ]);

      const ephemeralWallet = ethers.Wallet.createRandom(),
        fileId = IDs[0];

      await expect(
        sign(accounts[5], Arcana, Forward, "download", [fileId, ephemeralWallet.address]),
      ).to.be.revertedWith("user_bandwidth_limit_reached");
    });
  });

  describe("Upgradeable factory contract", () => {
    it("Upgrade factory with new version function", async () => {
      const FactoryV2 = await ethers.getContractFactory("FactoryTestV2");
      await upgrades.upgradeProxy(factory.address, FactoryV2);

      const newfactory = await FactoryV2.attach(factory.address);

      const sNewVersion = await newfactory.version();

      expect(+sNewVersion).equal(2);
    });
  });

  describe("Upgradeable Forwarder contract", () => {
    it("Upgrade Forwarder with new version function", async () => {
      const ForwarderV2 = await ethers.getContractFactory("ForwarderTestV2");
      await upgrades.upgradeProxy(Forward.address, ForwarderV2);

      const newForward = await ForwarderV2.attach(Forward.address);

      const sNewVersion = await newForward.version();

      expect(+sNewVersion).equal(2);
    });
  });

  describe("Upgradeable Arcana Beacon contract", () => {
    it("Upgrade Arcana(app) with new version function", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      const ArcanaFactoryV2 = (await ethers.getContractFactory("ArcanaTestV2", {
          libraries: {
            RoleLib: roleLib.address,
          },
        })) as ArcanaTestV2__factory,
        logic2 = await ArcanaFactoryV2.deploy();
      await logic2.deployed();

      const beaconAddress = await factory.getBeacon(),
        beaconFactory = (await ethers.getContractFactory("ArcanaBeacon")) as ArcanaBeacon__factory,
        beacon = beaconFactory.attach(beaconAddress);

      const txn = await beacon.update(logic2.address);
      await txn.wait();

      //attach same logic app to new ABI
      const newArcana = ArcanaFactoryV2.attach(Arcana.address);
      const version = await newArcana.version();
      expect(+version).equal(2);
      const implementationAddress = await factory.getImplementation();
      expect(implementationAddress).equal(logic2.address);
    });
    it("Delete App", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["deleteApp"]);
      await expect(sign(accounts[0], Arcana, Forward, "deleteApp", [])).to.emit(Arcana, "DeleteApp");
      await expect(sign(accounts[0], Arcana, Forward, "deleteApp", [])).to.be.revertedWith("deleted_app");
    });
  });

  describe("MFA accounts", () => {
    it("link new MFA generated key", async () => {
      const newMFAAddress = accounts[6].address;
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Forward, accounts[0], ["linkMFAAccount"]);

      await sign(accounts[0], Forward, Forward, "linkMFAAccount", [newMFAAddress]);

      expect(await Forward.mfaMapping(accounts[6].address)).to.be.equal(accounts[0].address);
    });

    it("Enable MFA at app level", async () => {
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();
      const newMFAAccount = accounts[6];

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );
      await registerForwarderMethods(Forward, Forward, accounts[0], ["linkMFAAccount", "updateAppLevelMFA"]);
      await registerForwarderMethods(Forward, Arcana, accounts[0], ["download"]);
      await registerForwarderMethods(Forward, DID, accounts[0], ["deleteFile"]);

      await sign(accounts[0], Forward, Forward, "linkMFAAccount", [newMFAAccount.address]);

      await sign(accounts[0], Forward, Forward, "updateAppLevelMFA", [Arcana.address, true]);

      expect(await Forward.mfaEnabledApps(accounts[0].address, Arcana.address)).to.be.equal(true);

      await expect(sign(newMFAAccount, Arcana, Forward, "download", [fileId, ephemeralWallet.address]))
        .to.emit(DID, "FilePermission")
        .withArgs(fileId, 1, Arcana.address, accounts[0].address);

      await sign(newMFAAccount, DID, Forward, "deleteFile", [fileId]);
    });
  });

  describe("Delegator Access", () => {
    //Delegator level
    it("Should add a delegator with permission", async () => {
      const delegator = accounts[1].address;
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["editAppPermission", "updateDelegator"]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, true]);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator, 1, true]);

      expect(await Arcana.delegators(delegator)).to.equal(1);
    });
    it("Should remove a delegator with permission", async () => {
      const delegator = accounts[1].address;
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["editAppPermission", "updateDelegator"]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, true]);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator, 1, true]);

      expect(await Arcana.delegators(delegator)).to.equal(1);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator, 1, false]);

      expect(await Arcana.delegators(delegator)).to.equal(0);
    });

    it("Delegator should be able to download", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "download",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [1, true]);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 1, true]);

      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await expect(sign(delegator, Arcana, Forward, "download", [fileId, ephemeralWallet.address]))
        .to.emit(DID, "FilePermission")
        .withArgs(fileId, 1, Arcana.address, delegator.address);
    });
    it("Delegator should be able to update File Ruleset", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "updateRuleSet",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [2, true]);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 2, true]);

      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      const newRuleSet = ethers.utils.id("new-rules");

      await sign(delegator, Arcana, Forward, "updateRuleSet", [fileId, newRuleSet]);

      expect(await DID.getRuleSet(fileId)).to.equal(newRuleSet);
    });
    it("Delegator should be able to remove file from app", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      Arcana = await upload(
        factory,

        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "removeUserFile",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [4, true]);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 4, true]);

      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await expect(sign(delegator, Arcana, Forward, "removeUserFile", [fileId]))
        .to.emit(DID, "FilePermission")
        .withArgs(fileId, 4, Arcana.address, delegator.address);
    });
    it("Delegator should be able to change owner of the file", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "changeFileOwner",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [8, true]);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 8, true]);

      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await expect(sign(delegator, Arcana, Forward, "changeFileOwner", [fileId, accounts[4].address]))
        .to.emit(DID, "FilePermission")
        .withArgs(fileId, 8, Arcana.address, delegator.address);

      expect(await DID.getFileOwner(fileId)).to.equal(accounts[4].address);
    });

    it("Edge case: Delegator should be able to remove already deleted file from app", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "removeUserFile",
      ]);
      await registerForwarderMethods(Forward, DID, accounts[0], ["deleteFile"]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [4, true]);

      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 4, true]);

      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await sign(accounts[0], DID, Forward, "deleteFile", [fileId]);

      await expect(sign(delegator, Arcana, Forward, "removeUserFile", [fileId]))
        .to.emit(DID, "FilePermission")
        .withArgs(fileId, 4, Arcana.address, delegator.address);
    });

    it("NEGATIVE: Download File that is not added by the owner", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();
      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "changeFileOwner",
        "removeUserFile",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [4, true]);
      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 4, true]);
      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await sign(delegator, Arcana, Forward, "removeUserFile", [fileId]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [8, true]);
      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 8, true]);
      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await expect(
        sign(delegator, Arcana, Forward, "changeFileOwner", [fileId, ephemeralWallet.address]),
      ).to.be.revertedWith("file_not_added_by_owner");
    });

    it("NEGATIVE: Only remove operation for deleted files", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "changeFileOwner",
      ]);
      await registerForwarderMethods(Forward, DID, accounts[0], ["deleteFile"]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [8, true]);
      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 8, true]);
      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await sign(accounts[0], DID, Forward, "deleteFile", [fileId]);

      await expect(
        sign(accounts[0], Arcana, Forward, "changeFileOwner", [fileId, ephemeralWallet.address]),
      ).to.be.revertedWith("only_remove_op_allowed");
    });

    it("NEGATIVE: User permission not granted", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "changeFileOwner",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [8, true]);
      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 8, true]);

      await expect(
        sign(delegator, Arcana, Forward, "changeFileOwner", [fileId, ephemeralWallet.address]),
      ).to.be.revertedWith("user_permission_not_granted");
    });

    it("NEGATIVE: File version mismatch", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "changeFileOwner",
        "revokeApp",
      ]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [8, true]);
      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 8, true]);
      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await sign(accounts[0], Arcana, Forward, "revokeApp", []);

      await expect(
        sign(accounts[0], Arcana, Forward, "changeFileOwner", [fileId, ephemeralWallet.address]),
      ).to.be.revertedWith("file_version_mismatch");

      await expect(
        sign(delegator, Arcana, Forward, "changeFileOwner", [fileId, ephemeralWallet.address]),
      ).to.be.revertedWith("file_version_mismatch");
    });

    it("NEGATIVE: Only remove operation for NFTs", async () => {
      const delegator = accounts[2];
      const fileId = IDs[0];
      const ephemeralWallet = ethers.Wallet.createRandom();

      Arcana = await upload(
        factory,
        accounts[1],
        accounts[0],
        store,
        bandwidth,
        Forward,
        Arcana,
        DID,
        ArcanaFactory,
        fileSize,
      );

      await registerForwarderMethods(Forward, Arcana, accounts[0], [
        "editAppPermission",
        "updateDelegator",
        "grantAppPermission",
        "changeFileOwner",
        "linkNFT",
      ]);

      const tokenId = 123;
      const nftContract = "0xd018E133CeF28AE3F4F27b16F1AB43BBdd53BDcb";
      const chainId = 100;

      await sign(accounts[0], Arcana, Forward, "linkNFT", [fileId, tokenId, nftContract, chainId]);

      await sign(accounts[0], Arcana, Forward, "editAppPermission", [8, true]);
      await sign(accounts[0], Arcana, Forward, "updateDelegator", [delegator.address, 8, true]);
      await sign(accounts[0], Arcana, Forward, "grantAppPermission", []);

      await expect(
        sign(accounts[0], Arcana, Forward, "changeFileOwner", [fileId, ephemeralWallet.address]),
      ).to.be.revertedWith("only_remove_op_allowed");
    });
  });

  describe("Global/Local key sharing", () => {
    it("Factory owner should be able to verify app", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await expect(factory.setAppVerification(Arcana.address, true))
        .to.emit(factory, "AppVerified")
        .withArgs(Arcana.address, true);

      expect(await Arcana.verification()).to.be.true;
    });

    it("App owner should be able to set unpartitioned", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["setUnPartition"]);

      //set app verification status to true
      await factory.setAppVerification(Arcana.address, true);

      await expect(sign(accounts[0], Arcana, Forward, "setUnPartition", [true]))
        .to.emit(Arcana, "Unpartitioned")
        .withArgs(true);

    });

    it("Edge case: Should be able to revoke verification and unpartition status by Factory owner", async () => {
      Arcana = await createApp(factory, accounts[0], store, bandwidth, Forward, Arcana, DID, ArcanaFactory);

      await registerForwarderMethods(Forward, Arcana, accounts[0], ["setUnPartition"]);

      //set app verification status to true
      await factory.setAppVerification(Arcana.address, true);

      await sign(accounts[0], Arcana, Forward, "setUnPartition", [true]);

      expect(await Arcana.unpartitioned()).to.be.true;
      expect(await Arcana.verification()).to.be.true;

      //revoke the verificaiton/unpartitioned status;
      await expect(factory.setAppVerification(Arcana.address, false))
        .to.emit(factory, "AppVerified")
        .withArgs(Arcana.address, false);

      expect(await Arcana.unpartitioned()).to.be.false;
      expect(await Arcana.verification()).to.be.false;
    });
  });
});
