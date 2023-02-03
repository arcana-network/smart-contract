import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { Forwarder } from "../typechain";
import { capitalize, generateTypeHash } from "./types";

export const registerFunctions = (contract: Contract): string[] => {
  const functions = contract.interface.functions;

  const methods = Object.values(functions)
    .filter((x: any) => x.stateMutability !== "view")
    .map((x: any) => x.name);

  return methods;
};

///@dev Register functions to be called via Forwarder
export const registerForwarderMethods = async (
  forward: Forwarder,
  contract: Contract,
  owner: SignerWithAddress,
  methods: string[] = ["uploadInit"],
) => {
  const typedFunctionsWithSign: any[] = [];

  for (const method of methods) {
    typedFunctionsWithSign.push(generateTypeHash(contract, method));
  }

  methods = methods.map(x => capitalize(x));
  // console.log({ methods, typedFunctionsWithSign});

  const tx = await forward.connect(owner).setMethodMappings(methods, typedFunctionsWithSign);
  await tx.wait();
};
