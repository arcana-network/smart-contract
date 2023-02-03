import { Contract } from "ethers";
import { ethers } from "hardhat";

export type TypeddataType = {
  message: ForwarderRequestType;
  types: {
    EIP712Domain: {
      name: string;
      type: string;
    }[];
    ForwardRequest: {
      name: string;
      type: string;
    }[];
  };
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  primaryType: string;
};

export type signMetaTxRequestType = {
  from: string;
  to: string;
  method: string;
};

export type ForwarderRequestType = {
  from: string;
  to: string;
  nonce: number;
  method: string;
};

type ParamType = {
  name: string;
  type: string;
};

export const typedData = (contract: Contract, method: string, complexType?: string[]): ParamType[] => {
  const fragment = contract.interface.getFunction(method);
  const result = [];
  for (const input of fragment.inputs) {
    const name = input.name;
    let { type } = input;

    if (type == "tuple" && !!complexType) {
      type = complexType[0];
      complexType.shift();
    }

    result.push({ name, type });
  }
  return result;
};

export function capitalize(method: string): string {
  return method.charAt(0).toUpperCase() + method.slice(1);
}

export function generateTypeHash(contract: Contract, method: string): string {
  const fragment = contract.interface.getFunction(method);
  let typeHash = capitalize(method) + "(";

  for (let i = 0; i < fragment.inputs.length; i++) {
    const { name, type } = fragment.inputs[i];

    if (i > 0) typeHash = typeHash.concat(",");
    typeHash = typeHash.concat(`${type} ${name}`);
  }
  typeHash = typeHash.concat(")");
  return typeHash;
}

export const typedMessageInstance = (contract: Contract, method: string, params: any[]): any => {
  const fragment = contract.interface.getFunction(method);

  const result: any = {};

  for (let i = 0; i < params.length; i++) {
    result[fragment.inputs[i].name] = ethers.BigNumber.isBigNumber(params[i]) ? +params[i] : params[i];
  }

  return result;
};
