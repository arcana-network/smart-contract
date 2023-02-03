import { ethers } from "hardhat";
(async () => {
  const provider = new ethers.providers.JsonRpcProvider("https://hardhat.arcana.network/");
  const data: any = await (
    await provider.getTransaction("0x9e6be58cb034ea99ea16dff4593869ec5d4779e697f5321accab1ff6983d5800")
  ).wait();
  if (!data.events) data.events = [];
  const abi = ["event NewApp(address owner, address appProxy)"];
  const iface = new ethers.utils.Interface(abi);
  let app_address: string = "";
  await Promise.all(
    data.logs.map(async (d: { topics: string[]; data: string }) => {
      if (d.topics.includes(iface.getEventTopic("NewApp"))) {
        const args = iface.parseLog(d).args;
        app_address = args.appProxy;
        console.log("App proxy:", app_address);
      }
    }),
  );
})();
